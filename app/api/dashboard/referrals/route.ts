import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    referral: db.referral,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const db = getDb();
    db.referral.invited += 1;
    if (db.referral.invited >= 5) {
      db.referral.premiumUnlocked = true;
    }
    saveDb(db);

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email || "friend"}!`,
      referral: db.referral,
    });
  } catch (error) {
    console.error("Referral API error:", error);
    return NextResponse.json({ error: "Failed to send referral" }, { status: 500 });
  }
}
