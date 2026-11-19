import { NextResponse } from "next/server";
import { getChildOverview } from "@/lib/server/db";
import { generateAIParentingSummary } from "@/lib/server/risk-engine";

export async function GET() {
  try {
    const overview = getChildOverview("child_01");
    const aiSummary = generateAIParentingSummary();

    return NextResponse.json({
      success: true,
      data: {
        ...overview,
        weeklyReport: aiSummary,
      },
    });
  } catch (error) {
    console.error("Dashboard overview API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard overview data" },
      { status: 500 }
    );
  }
}
