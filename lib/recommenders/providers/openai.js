const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_TOP_K = 5;

function extractTextFromResponse(json) {
  if (!Array.isArray(json?.output)) {
    return "";
  }

  for (const item of json.output) {
    if (item?.type !== "message" || !Array.isArray(item.content)) {
      continue;
    }

    const text = item.content.find((part) => part.type === "output_text")?.text;
    if (text) {
      return text;
    }
  }

  return "";
}

function parseTopK(source) {
  const explicitTopK = Number(source?.topK);
  if (Number.isFinite(explicitTopK) && explicitTopK > 0) {
    return Math.max(1, Math.min(20, Math.floor(explicitTopK)));
  }

  const fromTemplate = String(source?.promptTemplate || "").match(/\btop\s+(\d+)\b/i);
  if (fromTemplate) {
    const parsedTopK = Number(fromTemplate[1]);
    if (Number.isFinite(parsedTopK) && parsedTopK > 0) {
      return Math.max(1, Math.min(20, Math.floor(parsedTopK)));
    }
  }

  return DEFAULT_TOP_K;
}

function parseJsonPayload(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {}

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }

  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    } catch {}
  }

  return null;
}

function buildIssue(source, code, message) {
  return {
    code: `${source?.id || "source"}_${code}`,
    message
  };
}

function buildAllowedIds({ source, wordBank }) {
  const ids = [];

  if (Array.isArray(wordBank)) {
    for (const entry of wordBank) {
      if (entry?.enabled === false) {
        continue;
      }
      const value = String(entry?.word || "").trim();
      if (value) {
        ids.push(value);
      }
    }
  }

  const universe = String(source?.recommendationUniverse || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  ids.push(...universe);

  const deduped = [...new Set(ids)];
  return deduped;
}

export async function runOpenAi({ answers, source, normalizedQuestions, wordBank }) {
  const issues = [];

  if (!process.env.OPENAI_API_KEY) {
    issues.push(buildIssue(source, "missing_api_key", "OPENAI_API_KEY is missing. Add it to your environment."));
    return { items: [], issues };
  }

  const topK = parseTopK(source);
  const allowedIds = buildAllowedIds({ source, wordBank });
  const sourceInstruction =
    String(source?.promptTemplate || "").trim() || `Return top ${topK} recommendation IDs with confidence scores.`;

  const prompt = `
    You are a recommendation source inside a multi-source recommendation engine.
    Return strictly JSON and nothing else: {"items": [{"id": string, "score": number}]}
    Return at most ${topK} items.
    Follow this source instruction:
    ${sourceInstruction}

    Use these questions to understand intent:
    ${JSON.stringify(normalizedQuestions, null, 2)}

    User answers:
    ${JSON.stringify(answers, null, 2)}

    Source configuration:
    ${JSON.stringify(source, null, 2)}

    Allowed IDs:
    ${JSON.stringify(allowedIds, null, 2)}
  `.trim();

  let response;
  try {
    response = await fetch(source.endpoint || OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: source.model || "gpt-4.1-mini",
        input: prompt,
        temperature: 0.2
      })
    });
  } catch (error) {
    issues.push(buildIssue(source, "network_error", `OpenAI request failed: ${error?.message || "Network error"}`));
    return { items: [], issues };
  }

  if (!response.ok) {
    const responseText = await response.text();
    const shortResponse = responseText ? ` ${responseText.slice(0, 240)}` : "";
    issues.push(buildIssue(source, "http_error", `OpenAI request failed with ${response.status}.${shortResponse}`));
    return { items: [], issues };
  }

  const json = await response.json();
  const text = extractTextFromResponse(json);
  const parsed = parseJsonPayload(text);

  if (!Array.isArray(parsed?.items)) {
    issues.push(buildIssue(source, "invalid_response", "AI response was not valid JSON with an items array."));
    return { items: [], issues };
  }

  return {
    items: parsed.items
      .filter((item) => typeof item?.id === "string")
      .map((item) => ({
        id: item.id,
        score: Number(item.score || 0) * Number(source.weight || 1),
        source: source.name
      })),
    issues
  };
}
