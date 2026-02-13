import { NextResponse } from "next/server";
import { buildQuestionnaire } from "@/lib/questionnaire";
import { runRecommenders } from "@/lib/recommenders";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(request) {
  try {
    const { questions, answers, sources, wordBank } = await request.json();

    const { normalizedQuestions } = buildQuestionnaire(Array.isArray(questions) ? questions : []);

    const { recommendations, issues } = await runRecommenders({
      sources: Array.isArray(sources) ? sources : [],
      answers: answers || {},
      normalizedQuestions,
      wordBank: Array.isArray(wordBank) ? wordBank : []
    });

    return withCors(
      NextResponse.json({
        recommendations,
        issues,
        metadata: {
          questionCount: normalizedQuestions.length,
          sourceCount: Array.isArray(sources) ? sources.length : 0,
          wordCount: Array.isArray(wordBank) ? wordBank.length : 0,
          generatedAt: new Date().toISOString()
        }
      })
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Failed to generate recommendations",
          details: error?.message || "Unknown error"
        },
        { status: 500 }
      )
    );
  }
}
