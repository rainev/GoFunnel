import { runOpenAi } from "@/lib/recommenders/providers/openai";

const providerRegistry = {
  openai: runOpenAi
};

function parseTopLimit(source) {
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

  return 5;
}

export async function runRecommenders({ sources, answers, normalizedQuestions, wordBank }) {
  const enabledSources = (sources || []).filter((source) => source.enabled !== false);
  const recommendationMap = {};
  const issues = [];
  const maxRecommendations =
    enabledSources.reduce((max, source) => Math.max(max, parseTopLimit(source)), 0) || 5;

  for (const source of enabledSources) {
    const runner = providerRegistry[source.provider];
    if (!runner) {
      issues.push({
        code: `${source?.id || "source"}_unsupported_provider`,
        message: `Provider "${source?.provider}" is not supported.`
      });
      continue;
    }

    const output = await runner({
      answers,
      normalizedQuestions,
      source,
      wordBank: wordBank || []
    });

    const sourceItems = Array.isArray(output) ? output : output?.items;
    const sourceIssues = Array.isArray(output?.issues) ? output.issues : [];
    issues.push(...sourceIssues);

    for (const item of sourceItems || []) {
      recommendationMap[item.id] ||= {
        id: item.id,
        score: 0,
        contributors: []
      };

      recommendationMap[item.id].score += Number(item.score || 0);
      recommendationMap[item.id].contributors.push({
        source: item.source || source.name,
        score: Number(item.score || 0)
      });
    }
  }

  const recommendations = Object.values(recommendationMap)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxRecommendations);

  return {
    recommendations,
    issues
  };
}
