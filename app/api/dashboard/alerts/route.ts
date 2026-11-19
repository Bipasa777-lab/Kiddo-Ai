import { NextRequest, NextResponse } from "next/server";
import { getDb, resolveAlertWithFeedback } from "@/lib/server/db";

export async function GET() {
  const db = getDb();
  return NextResponse.json({
    alerts: db.riskAlerts,
    activeAlerts: db.riskAlerts.filter((a) => a.status === "active"),
    resolvedAlerts: db.riskAlerts.filter((a) => a.status === "resolved"),
    interventions: db.interventions,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { alertId, parentFeedback, outcome } = await req.json();

    if (!alertId) {
      return NextResponse.json({ error: "alertId is required" }, { status: 400 });
    }

    const updatedAlert = resolveAlertWithFeedback(
      alertId,
      parentFeedback || "Reviewed and addressed offline with child.",
      outcome || "improved"
    );

    if (!updatedAlert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const db = getDb();
    return NextResponse.json({
      success: true,
      alert: updatedAlert,
      modelAccuracy: db.modelTrainingMetrics.modelAccuracy,
      newWellbeingScore: db.child.wellbeingScore,
      message: "Feedback recorded. Model telemetry updated successfully.",
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    return NextResponse.json({ error: "Failed to resolve alert" }, { status: 500 });
  }
}
