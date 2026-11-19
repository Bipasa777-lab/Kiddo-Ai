import { NextRequest, NextResponse } from "next/server";
import { getDb, addMoodLog, deleteMoodLog } from "@/lib/server/db";

export async function GET() {
  try {
    const db = getDb();
    const journal = db.moodJournal || [];

    const totalLogs = journal.length;
    const avgScore =
      totalLogs > 0
        ? Number((journal.reduce((acc, m) => acc + (m.score || 0), 0) / totalLogs).toFixed(1))
        : 3.5;
    const happyCount = journal.filter((m) => m.score >= 4).length;
    const happyPct = totalLogs > 0 ? Math.round((happyCount / totalLogs) * 100) : 60;

    return NextResponse.json({
      success: true,
      moodJournal: journal,
      avatarState: db.avatarState,
      stats: {
        totalLogs,
        avgScore,
        happyPct,
        childName: db.child.name,
      },
    });
  } catch (error) {
    console.error("Mood GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch mood data" }, { status: 500 });
  }
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Mood entry ID required" }, { status: 400 });
    }

    const deleted = deleteMoodLog(id);
    const db = getDb();

    return NextResponse.json({
      success: deleted,
      moodJournal: db.moodJournal,
    });
  } catch (error) {
    console.error("Mood DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete mood entry" }, { status: 500 });
  }
}
