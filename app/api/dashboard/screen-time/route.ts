import { NextRequest, NextResponse } from "next/server";
import {
  getDb,
  getWeeklyScreenTime,
  getScreenTimeSettings,
  updateScreenTimeSettings,
  logScreenTimeSession,
} from "@/lib/server/db";

export async function GET() {
  try {
    const db = getDb();
    const weeklyScreenTime = getWeeklyScreenTime();
    const settings = getScreenTimeSettings();

    const categories = [
      { key: "education", label: "Education", color: "var(--primary)" },
      { key: "social", label: "Social Media", color: "#EC4899" },
      { key: "gaming", label: "Gaming", color: "var(--accent)" },
      { key: "entertainment", label: "Entertainment", color: "var(--warning)" },
    ] as const;

    const totals = categories.map((c) => ({
      ...c,
      total: Number(
        weeklyScreenTime.reduce((sum, d) => sum + (d[c.key as keyof typeof d] as number || 0), 0).toFixed(1)
      ),
    }));

    const grandTotal = Number(totals.reduce((s, c) => s + c.total, 0).toFixed(1));
    const averageDaily = Number((grandTotal / (weeklyScreenTime.length || 7)).toFixed(1));

    return NextResponse.json({
      success: true,
      weeklyScreenTime,
      totals,
      grandTotal,
      averageDaily,
      settings,
      child: db.child,
    });
  } catch (error) {
    console.error("Screen time GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch screen time data" }, { status: 500 });
  }
}

// Log or simulate screen time session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hours, category, appName, day } = body;

    if (!category) {
      return NextResponse.json({ error: "category is required" }, { status: 400 });
    }

    const result = logScreenTimeSession({
      day,
      hours: Number(hours) || 0.5,
      category,
      appName,
    });

    return NextResponse.json({
      success: true,
      message: `Added ${hours || 0.5}h of ${category} screen time.`,
      ...result,
    });
  } catch (error) {
    console.error("Screen time POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to log screen time" }, { status: 500 });
  }
}

// Update screen time settings (curfew, daily limits, device pause)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateScreenTimeSettings(body);

    return NextResponse.json({
      success: true,
      message: "Screen time controls updated successfully.",
      settings: updated,
    });
  } catch (error) {
    console.error("Screen time PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 });
  }
}
