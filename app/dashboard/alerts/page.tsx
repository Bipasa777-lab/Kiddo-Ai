"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskAlertCard } from "@/components/dashboard/risk-alert-card";
import { DeviceSimulator } from "@/components/simulator/device-simulator";
import { ShieldAlert, CheckCircle2, Smartphone, RefreshCw, Filter } from "lucide-react";
import { riskAlerts as fallbackAlerts, type RiskLevel } from "@/lib/mock-data";

interface AlertItem {
  id: string;
  title: string;
  detail: string;
  level: RiskLevel;
  confidence: number;
  suggestedAction: string;
  researchCitation?: string;
  timestamp: string;
  status: "active" | "resolved" | "dismissed";
  parentFeedback?: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>(
    fallbackAlerts.map((a) => ({ ...a, status: "active" as const }))
  );
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all");
  const [loading, setLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/alerts");
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (
    alertId: string,
    feedback: string,
    outcome: "improved" | "false_positive"
  ) => {
    try {
      await fetch("/api/dashboard/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, parentFeedback: feedback, outcome }),
      });
      await fetchAlerts();
    } catch (err) {
      console.error("Failed to resolve alert:", err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "active") return a.status === "active";
    if (filter === "resolved") return a.status === "resolved";
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const resolvedCount = alerts.filter((a) => a.status === "resolved").length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Topbar
          title="Risk Alerts & Interventions"
          subtitle="Behavioural signals detected by the AI Risk Engine and offline parenting actions taken."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            <Smartphone size={13} />
            <span>{showSimulator ? "Hide Simulator" : "Trigger Test Risk Event"}</span>
          </button>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card hover:bg-card/80 text-muted"
            title="Refresh alerts"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {showSimulator && (
        <div className="mb-6">
          <DeviceSimulator onEventProcessed={fetchAlerts} />
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "all" ? "bg-primary text-white" : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            All Signals ({alerts.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "active" ? "bg-primary text-white" : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            Active Flags ({activeCount})
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filter === "resolved" ? "bg-primary text-white" : "border border-border bg-card text-muted hover:text-foreground"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        <span className="text-xs text-muted">
          Showing {filteredAlerts.length} item{filteredAlerts.length === 1 ? "" : "s"}
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signals &amp; Closed-Loop Interventions</CardTitle>
        </CardHeader>
        <div className="grid gap-4 md:grid-cols-2 p-4 pt-0">
          {filteredAlerts.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-sm text-muted">
              No alerts found for this filter.
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <RiskAlertCard
                key={alert.id}
                {...alert}
                onResolve={handleResolve}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
