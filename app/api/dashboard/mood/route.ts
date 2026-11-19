import { NextRequest, NextResponse } from "next/server";
import { getDb, addMoodLog } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    moodJournal: db.moodJournal,
    avatarState: db.avatarState,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { mood, score, note } = await req.json();

    if (!mood || score === undefined) {
      return NextResponse.json({ error: "mood and score are required" }, { status: 400 });
    }

    const entry = addMoodLog(mood, Number(score), note || "");
    const db = getDb();

    return NextResponse.json({
      success: true,
      entry,
      moodJournal: db.moodJournal,
      avatarState: db.avatarState,
      wellbeingScore: db.child.wellbeingScore,
    });
  } catch (error) {
    console.error("Error saving mood log:", error);
    return NextResponse.json({ error: "Failed to save mood" }, { status: 500 });
  }
}
