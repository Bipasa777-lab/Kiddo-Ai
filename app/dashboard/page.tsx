"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { WellbeingRing } from "@/components/dashboard/wellbeing-ring";
import { ScreenTimeChart } from "@/components/dashboard/screen-time-chart";
import { MoodChart } from "@/components/dashboard/mood-chart";
import { RiskAlertCard } from "@/components/dashboard/risk-alert-card";
import { Badge } from "@/components/ui/badge";
import { DeviceSimulator } from "@/components/simulator/device-simulator";
import { Smartphone, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import {
  child as fallbackChild,
  riskAlerts as fallbackAlerts,
  appUsage as fallbackApps,
  weeklyReport as fallbackReport,
} from "@/lib/mock-data";

export default function OverviewPage() {
  const [data, setData] = useState({
    child: fallbackChild,
    riskAlerts: fallbackAlerts.filter((a) => a.level !== "low"),
    appUsage: fallbackApps,
    weeklyReport: fallbackReport,
  });
  const [loading, setLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/overview");
      const json = await res.json();
      if (json.success && json.data) {
        setData({
          child: json.data.child,
          riskAlerts: json.data.riskAlerts || [],
          appUsage: json.data.appUsage || fallbackApps,
          weeklyReport: json.data.weeklyReport || fallbackReport,
        });
      }
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleResolveAlert = async (
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
      await fetchOverview();
    } catch (err) {
      console.error("Error resolving alert:", err);
    }
  };

  const topApps = data.appUsage.slice(0, 3);
  const topAlert = data.riskAlerts[0] || fallbackAlerts[0];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <Topbar
          title="Good evening 👋"
          subtitle={`Here's how ${data.child.name} is doing this week.`}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
          >
            <Smartphone size={13} />
            <span>{showSimulator ? "Close Emulator" : "Device Event Simulator"}</span>
          </button>
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card hover:bg-card/80 text-muted transition"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Expandable Device Telemetry Simulator */}
      {showSimulator && (
        <div className="mb-6">
          <DeviceSimulator onEventProcessed={fetchOverview} />
        </div>
      )}

      {/* Row 1: Wellbeing Ring & Screen Time Chart */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center lg:col-span-1">
          <CardHeader className="w-full">
            <CardTitle>Digital Wellbeing Score</CardTitle>
          </CardHeader>
          <WellbeingRing score={data.child.wellbeingScore} trend={data.child.wellbeingTrend} />
          <p className="mt-4 max-w-xs text-center text-xs text-muted">
            Calculated from sleep hygiene, night usage, educational balance, and emotional indicators.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Screen Time This Week</CardTitle>
            <Link href="/dashboard/screen-time" className="text-xs text-primary hover:underline">
              View details →
            </Link>
          </CardHeader>
          <ScreenTimeChart />
        </Card>
      </div>

      {/* Row 2: Mood Trend, Top Apps, Top Risk Alert */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Mood Trend</CardTitle>
            <Link href="/dashboard/mood" className="text-xs text-primary hover:underline">
              Journal →
            </Link>
          </CardHeader>
          <MoodChart />
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Top Apps</CardTitle>
            <Link href="/dashboard/app-usage" className="text-xs text-primary hover:underline">
              All apps →
            </Link>
          </CardHeader>
          <div className="flex flex-col gap-3">
            {topApps.map((app) => (
              <div key={app.app} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: app.color }} />
                  <span className="text-sm">{app.app}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{app.time}</p>
                  <p className="text-xs text-muted">{app.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Active Risk Signals ({data.riskAlerts.length})</CardTitle>
            <Link href="/dashboard/alerts" className="text-xs text-primary hover:underline">
              All alerts →
            </Link>
          </CardHeader>
          <RiskAlertCard {...topAlert} onResolve={handleResolveAlert} />
        </Card>
      </div>

      {/* Row 3: AI Weekly Summary & Closed Loop Wins */}
      <Card className="mt-5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Risk &amp; Insight Summary</CardTitle>
            <Badge color="var(--secondary)">Heuristic Model v1</Badge>
          </div>
        </CardHeader>
        <p className="text-sm leading-relaxed text-muted">{data.weeklyReport.summary}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold text-accent">Wins &amp; Positive Behaviors</p>
            <ul className="space-y-1 text-sm text-muted">
              {data.weeklyReport.wins?.map((w: string) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-warning">Watch-outs &amp; Interventions</p>
            <ul className="space-y-1 text-sm text-muted">
              {data.weeklyReport.watchouts?.map((w: string) => (
                <li key={w}>• {w}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
