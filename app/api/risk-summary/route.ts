import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getDb } from "@/lib/server/db";
import { generateAIParentingSummary } from "@/lib/server/risk-engine";

export async function GET() {
  const db = getDb();
  const child = db.child;
  const localSummary = generateAIParentingSummary();

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json({
      summary: localSummary.summary,
      wins: localSummary.wins,
      watchouts: localSummary.watchouts,
      source: "local-risk-engine",
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are KiddoAI's Risk Engine. Given behavioural data, write a concise (under 80 words) weekly wellbeing summary for a parent: factual, calm, and actionable. No headers, just one short paragraph.",
        },
        {
          role: "user",
          content: `Child: ${child.name}, wellbeing score ${child.wellbeingScore}/100.
Screen time by day: ${JSON.stringify(db.weeklyScreenTime)}.
Top apps: ${JSON.stringify(db.appUsage.slice(0, 4))}.
Active alerts: ${JSON.stringify(db.riskAlerts.filter((a) => a.status === "active"))}.`,
        },
      ],
      max_tokens: 150,
    });

    return NextResponse.json({
      summary: completion.choices[0]?.message?.content ?? localSummary.summary,
      wins: localSummary.wins,
      watchouts: localSummary.watchouts,
      source: "openai-risk-engine",
    });
  } catch (err) {
    console.error("OpenAI summary failed, returning local summary:", err);
    return NextResponse.json({
      summary: localSummary.summary,
      wins: localSummary.wins,
      watchouts: localSummary.watchouts,
      source: "local-risk-engine-fallback",
    });
  }
}
