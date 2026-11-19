import { NextRequest, NextResponse } from "next/server";
import { getDb, TelemetryEvent } from "@/lib/server/db";
import { evaluateTelemetryEvent } from "@/lib/server/risk-engine";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    events: db.telemetryEvents.slice(-20),
    totalCount: db.telemetryEvents.length,
    activeAlerts: db.riskAlerts.filter((a) => a.status === "active"),
    wellbeingScore: db.child.wellbeingScore,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      childId: body.childId || "child_01",
      timestamp: new Date().toISOString(),
      eventType: body.eventType || "app_session",
      appName: body.appName || "Unknown App",
      durationMinutes: Number(body.durationMinutes) || 30,
      hourOfDay: body.hourOfDay !== undefined ? Number(body.hourOfDay) : new Date().getHours(),
      category: body.category || "entertainment",
      sentimentText: body.sentimentText || undefined,
      locationPlace: body.locationPlace || undefined,
      locationEvent: body.locationEvent || undefined,
    };

    const evaluation = evaluateTelemetryEvent(event);

    return NextResponse.json({
      success: true,
      event,
      evaluation,
    });
  } catch (error) {
    console.error("Telemetry ingestion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process telemetry event" },
      { status: 500 }
    );
  }
}
