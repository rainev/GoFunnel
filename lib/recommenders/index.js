import { runOpenAi } from "@/lib/recommenders/providers/openai";

const providerRegistry = {
  openai: runOpenAi
};

export async function runRecommenders({ sources, answers, normalizedQuestions, wordBank }) {
  const enabledSources = (sources || []).filter((source) => source.enabled !== false);
  const recommendationMap = {};

  for (const source of enabledSources) {
    const runner = providerRegistry[source.provider];
    if (!runner) {
      continue;
    }

    const output = await runner({
      answers,
      normalizedQuestions,
      source,
      wordBank: wordBank || []
    });

    for (const item of output) {
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

  return Object.values(recommendationMap)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
