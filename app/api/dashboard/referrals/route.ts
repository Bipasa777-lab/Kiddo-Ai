import { NextRequest, NextResponse } from "next/server";
import {
  getReferralData,
  sendReferralInvite,
  deleteReferralInvite,
  claimReferralMilestone,
} from "@/lib/server/db";

export async function GET() {
  try {
    const referral = getReferralData();

    const milestones = [
      { count: 1, label: "1 Month Free Premium", reached: referral.invited >= 1, current: referral.invited < 1 },
      { count: 3, label: "3 Months Free Premium", reached: referral.invited >= 3, current: referral.invited >= 1 && referral.invited < 3 },
      { count: 5, label: "1 Year Family Upgrade", reached: referral.invited >= 5, current: referral.invited >= 3 && referral.invited < 5 },
      { count: 10, label: "Lifetime VIP Access", reached: referral.invited >= 10, current: referral.invited >= 5 && referral.invited < 10 },
    ];

    const logs = referral.logs || [];
    const subscribedCount = logs.filter((l) => l.status === "Subscribed").length;
    const trialCount = logs.filter((l) => l.status === "Trial Active").length;

    return NextResponse.json({
      success: true,
      referral,
      milestones,
      stats: {
        totalInvited: referral.invited,
        subscribedCount,
        trialCount,
        leaderboardRank: referral.leaderboardRank,
        premiumUnlocked: referral.premiumUnlocked,
      },
    });
  } catch (error) {
    console.error("Referral GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch referral data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "claim") {
      const result = claimReferralMilestone(Number(body.count) || 1);
      return NextResponse.json(result);
    }

    const { email } = body;
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
    }

    const result = sendReferralInvite(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Referral POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to process referral action" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Referral ID required" }, { status: 400 });
    }

    const success = deleteReferralInvite(id);
    return NextResponse.json({
      success,
      message: "Referral removed.",
      referral: getReferralData(),
    });
  } catch (error) {
    console.error("Referral DELETE error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete referral" }, { status: 500 });
  }
}
