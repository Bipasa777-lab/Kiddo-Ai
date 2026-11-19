import { NextRequest, NextResponse } from "next/server";
import {
  getChildDashboardData,
  completeChildChallenge,
  updateAvatarCompanionState,
  tapAvatarCompanion,
  getDb,
  saveDb,
} from "@/lib/server/db";

export async function GET() {
  try {
    const data = getChildDashboardData("child_01");
    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error("Child dashboard GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load child dashboard" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "complete_challenge") {
      const result = completeChildChallenge(body.challengeId);
      return NextResponse.json(result);
    }

    if (action === "tap_avatar") {
      const result = tapAvatarCompanion();
      return NextResponse.json(result);
    }

    if (action === "update_avatar") {
      const updated = updateAvatarCompanionState(body.update || {});
      return NextResponse.json({ success: true, avatarState: updated });
    }

    if (action === "log_break") {
      const db = getDb();
      db.avatarState.rewardPoints += 25;
      db.avatarState.moodExpression = "proud";
      db.avatarState.activeNudge = "Superstar move! Taking deliberate screen breaks is how champions recharge. 🌟 (+25 points!)";
      db.avatarState.lastInteraction = new Date().toISOString();
      saveDb(db);

      return NextResponse.json({
        success: true,
        message: "Screen break completed! +25 Points!",
        avatarState: db.avatarState,
        rewardPoints: db.avatarState.rewardPoints,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Child dashboard POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to process child dashboard action" }, { status: 500 });
  }
}
