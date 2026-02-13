import { NextResponse } from "next/server";

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function GET() {
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY || process.env.OPENI_API_KEY);

  return withCors(
    NextResponse.json({
      status: hasApiKey ? "ok" : "degraded",
      service: "pluggable-recommender-api",
      openaiConfigured: hasApiKey,
      timestamp: new Date().toISOString()
    })
  );
}
