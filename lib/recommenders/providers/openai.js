const OPENAI_API_URL = "https://api.openai.com/v1/responses";

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

export async function runOpenAi({ answers, source, normalizedQuestions }) {
  if (!process.env.OPENAI_API_KEY) {
    return [];
  }

  const prompt = `
    You are a recommendation source inside a multi-source recommendation engine.
    Return strictly JSON: {"items": [{"id": string, "score": number}]}

    Use these questions to understand intent:
    ${JSON.stringify(normalizedQuestions, null, 2)}

    User answers:
    ${JSON.stringify(answers, null, 2)}

    Source configuration:
    ${JSON.stringify(source, null, 2)}

    Allowed IDs:
    ["money_market_fund","time_deposit","government_bonds","corporate_bonds","bond_fund","balanced_fund","index_fund_etf","blue_chip_stocks","dividend_stocks","growth_stocks","gold_etf","physical_gold","crypto_btc","crypto_eth","commodity_etf","life_insurance","vul_insurance"]
  `.trim();

  const response = await fetch(source.endpoint || OPENAI_API_URL, {
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

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  const text = extractTextFromResponse(json);

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.items)) {
      return [];
    }

    return parsed.items
      .filter((item) => typeof item?.id === "string")
      .map((item) => ({
        id: item.id,
        score: Number(item.score || 0) * Number(source.weight || 1),
        source: source.name
      }));
  } catch {
    return [];
  }
}
