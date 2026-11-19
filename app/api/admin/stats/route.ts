import { NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export async function GET() {
  try {
    const db = getDb();
    const totalUsers = db.systemUsers.length + db.adminStats.totalUsers;
    const activeUsers = db.systemUsers.filter((u) => u.status === "Active").length;
    const suspendedUsers = db.systemUsers.filter((u) => u.status === "Suspended").length;
    const flaggedUsers = db.systemUsers.filter((u) => u.status === "Flagged").length;

    const statsData = {
      kpis: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        flaggedUsers,
        childrenCount: db.adminStats.children,
        parentsCount: db.adminStats.parents,
        activeSubscriptions: db.adminStats.activeSubscriptions,
        monthlyRevenue: db.adminStats.monthlyRevenue,
        riskAlertsToday: db.adminStats.riskAlertsToday + db.riskAlerts.filter((a) => a.status === "active").length,
        modelAccuracy: db.modelTrainingMetrics.modelAccuracy,
      },
      systemHealth: {
        serverStatus: "Operational",
        uptime: "99.98%",
        cpuUsage: "14%",
        memoryUsage: "1.2 GB / 4.0 GB",
        avgResponseTimeMs: 42,
        activeWebsockets: 1420,
        lastDiagnosticRun: db.modelTrainingMetrics.lastRetrainedAt || new Date().toISOString(),
      },
      subscriptionBreakdown: {
        free: 4500,
        premium: 4860,
        family: 3120,
      },
      heuristicRules: db.heuristicRules,
      modelTrainingMetrics: db.modelTrainingMetrics,
    };

    return NextResponse.json(statsData);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to load admin statistics" },
      { status: 500 }
    );
  }
}
