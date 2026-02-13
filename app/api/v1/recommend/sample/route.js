import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    questions: [
      {
        id: "budget",
        label: "What is your budget?",
        type: "single",
        options: ["Low", "Mid", "High"],
        required: true
      },
      {
        id: "use_case",
        label: "What are you using this for?",
        type: "multi",
        options: ["Work", "Travel", "Gaming"],
        required: true
      }
    ],
    answers: {
      purpose: "Buy to live",
      budget_range: "$300,000-$600,000",
      property_type: ["Condo", "Townhouse"],
      bedrooms: "2",
      location_preference: ["Near transport", "City center"],
      timeline: "1-3 months"
    },
    sources: [
      {
        id: "source_openai",
        name: "OpenAI Recommender",
        provider: "openai",
        endpoint: "https://api.openai.com/v1/responses",
        model: "gpt-4.1-mini",
        weight: 1,
        enabled: true,
        promptTemplate: "Return top 5 recommendation IDs with confidence scores",
        recommendationUniverse: "listing_riverside_2br\nlisting_metro_studio\nlisting_greenfield_3br"
      }
    ],
    wordBank: [
      { id: "item_1", word: "listing_riverside_2br", enabled: true },
      { id: "item_2", word: "listing_metro_studio", enabled: true },
      { id: "item_3", word: "listing_greenfield_3br", enabled: true }
    ]
  });
}
