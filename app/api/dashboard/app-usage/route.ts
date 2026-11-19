import { NextRequest, NextResponse } from "next/server";
import {
  getDb,
  getAppUsage,
  setAppDailyLimit,
  simulateAppSession,
} from "@/lib/server/db";

export async function GET() {
  try {
    const db = getDb();
    const appUsage = getAppUsage();

    const totalMinutes = appUsage.reduce((acc, a) => acc + (a.minutes || 0), 0);
    const totalHours = Number((totalMinutes / 60).toFixed(1));

    // Category distribution
    const categoryTotals: Record<string, number> = {};
    appUsage.forEach((a) => {
      const cat = a.category || "entertainment";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + a.minutes;
    });

    const categoryBreakdown = Object.entries(categoryTotals).map(([cat, mins]) => ({
      category: cat,
      minutes: mins,
      percentage: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
      hours: Number((mins / 60).toFixed(1)),
    }));

    return NextResponse.json({
      success: true,
      appUsage,
      totalMinutes,
      totalHours,
      categoryBreakdown,
      child: db.child,
    });
  } catch (error) {
    console.error("App usage GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch app usage" }, { status: 500 });
  }
}

// Simulate / add app usage session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { app, minutes, category } = body;

    if (!app) {
      return NextResponse.json({ error: "app name is required" }, { status: 400 });
    }

    const result = simulateAppSession(app, Number(minutes) || 30, category || "entertainment");

    return NextResponse.json({
      success: true,
      message: `Simulated ${minutes || 30} mins session for ${app}.`,
      ...result,
    });
  } catch (error) {
    console.error("App usage POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to simulate app session" }, { status: 500 });
  }
}

// Update app limits or block state
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { app, dailyLimitMinutes, isBlocked } = body;

    if (!app) {
      return NextResponse.json({ error: "app name is required" }, { status: 400 });
    }

    const updatedApp = setAppDailyLimit(app, Number(dailyLimitMinutes) || 120, Boolean(isBlocked));

    if (!updatedApp) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Updated limits for ${app}.`,
      app: updatedApp,
      appUsage: getAppUsage(),
    });
  } catch (error) {
    console.error("App usage PUT error:", error);
    return NextResponse.json({ success: false, error: "Failed to update app limits" }, { status: 500 });
  }
}
