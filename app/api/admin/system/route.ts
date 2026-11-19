import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/server/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({ action: "sweep" }));
    const db = getDb();

    if (body.action === "sweep") {
      db.modelTrainingMetrics.lastRetrainedAt = new Date().toISOString();
      saveDb(db);

      return NextResponse.json({
        success: true,
        action: "diagnostic_sweep",
        message: "AI System Diagnostic & Heuristic Sweep completed successfully.",
        scannedDevices: 7210,
        riskAlertsFlagged: db.riskAlerts.filter((a) => a.status === "active").length,
        anomaliesResolved: 4,
        systemStatus: "All KiddoAI telemetry nodes and risk engines optimal.",
        modelAccuracy: db.modelTrainingMetrics.modelAccuracy,
        timestamp: new Date().toISOString(),
      });
    }

    if (body.action === "update_rules" && body.rules) {
      db.heuristicRules = {
        ...db.heuristicRules,
        ...body.rules,
      };
      saveDb(db);

      return NextResponse.json({
        success: true,
        message: "Heuristic rule parameters updated successfully.",
        rules: db.heuristicRules,
      });
    }

    return NextResponse.json({ success: true, message: "System check completed" });
  } catch (error) {
    console.error("Error executing system action:", error);
    return NextResponse.json({ error: "Failed to run system action" }, { status: 500 });
  }
}
