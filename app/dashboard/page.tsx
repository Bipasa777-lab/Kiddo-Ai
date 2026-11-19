"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { WellbeingRing } from "@/components/dashboard/wellbeing-ring";
import { ScreenTimeChart } from "@/components/dashboard/screen-time-chart";
import { MoodChart } from "@/components/dashboard/mood-chart";
import { RiskAlertCard } from "@/components/dashboard/risk-alert-card";
import { Badge } from "@/components/ui/badge";
import { DeviceSimulator } from "@/components/simulator/device-simulator";
import {
  Smartphone,
  RefreshCw,
  Sparkles,
  Gift,
  Clock,
  PauseCircle,
  PlayCircle,
  Moon,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  child as fallbackChild,
  riskAlerts as fallbackAlerts,
  appUsage as fallbackApps,
  weeklyReport as fallbackReport,
  weeklyScreenTime as fallbackScreenTime,
  moodJournal as fallbackMoods,
  referral as fallbackReferral,
} from "@/lib/mock-data";

interface OverviewAppData {
  app: string;
  time: string;
  minutes: number;
  percentage: number;
  color: string;
  category?: string;
}

export default function OverviewPage() {
  const [data, setData] = useState({
    child: fallbackChild,
    riskAlerts: fallbackAlerts.filter((a) => a.level !== "low"),
    weeklyScreenTime: fallbackScreenTime,
    screenTimeSettings: { dailyLimitHours: 4.5, bedtimeCurfew: "21:30", devicePaused: false },
    appUsage: fallbackApps as OverviewAppData[],
    moodJournal: fallbackMoods,
    referral: fallbackReferral,
    weeklyReport: fallbackReport,
  });
  const [loading, setLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.data) {
        setData({
          child: json.data.child || fallbackChild,
          riskAlerts: json.data.riskAlerts || [],
          weeklyScreenTime: json.data.weeklyScreenTime || fallbackScreenTime,
          screenTimeSettings: json.data.screenTimeSettings || {
            dailyLimitHours: 4.5,
            bedtimeCurfew: "21:30",
            devicePaused: false,
          },
          appUsage: json.data.appUsage || fallbackApps,
          moodJournal: json.data.moodJournal || fallbackMoods,
          referral: json.data.referral || fallbackReferral,
          weeklyReport: json.data.weeklyReport || fallbackReport,
        });
      }
    } catch (err) {
      console.error("Failed to load overview data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

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

  const handleToggleDevicePause = async () => {
    try {
      setTogglingPause(true);
      const newPausedState = !data.screenTimeSettings.devicePaused;
      await fetch("/api/dashboard/screen-time", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devicePaused: newPausedState }),
      });
      await fetchOverview();
    } catch (err) {
      console.error("Error toggling device pause:", err);
    } finally {
      setTogglingPause(false);
    }
  };

  const handleCopyInviteLink = () => {
    const code = data.referral?.code || "AARAV-4F2K";
    navigator.clipboard.writeText(`https://kiddoai.com/invite?code=${code}`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const topApps = data.appUsage.slice(0, 4);
  const topAlert = data.riskAlerts[0] || fallbackAlerts[0];

  // Calculate today's screen time
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDay = dayNames[new Date().getDay()];
  const todayData = data.weeklyScreenTime.find((d) => d.day === todayDay) || data.weeklyScreenTime[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <Topbar
          title="Parent Dashboard Overview 👋"
          subtitle={`Real-time behavioral telemetry, screen balance, and emotional indicators for ${data.child.name}.`}
        />
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className="flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary transition hover:bg-primary/20 shadow-sm"
          >
            <Smartphone size={14} />
            <span>{showSimulator ? "Hide Emulator" : "Telemetry Emulator"}</span>
          </button>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card hover:bg-background text-foreground transition shadow-sm disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
          </button>
        </div>
      </div>

      {/* Expandable Device Telemetry Simulator */}
      {showSimulator && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm">
          <DeviceSimulator onEventProcessed={fetchOverview} />
        </div>
      )}

      {/* Quick Telemetry & Control Strip (4 Status Cards) */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Today's Screen Time vs Limit */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Today&apos;s Screen Time</span>
            <Clock size={15} className="text-primary" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-bold font-heading text-foreground">
              {todayData.hours}h
            </span>
            <span className="text-xs text-muted">/ {data.screenTimeSettings.dailyLimitHours}h cap</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full transition-all ${
                todayData.hours > data.screenTimeSettings.dailyLimitHours ? "bg-danger" : "bg-primary"
              }`}
              style={{
                width: `${Math.min(100, (todayData.hours / data.screenTimeSettings.dailyLimitHours) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Card 2: Bedtime Curfew & Device Pause */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Bedtime Curfew Control</span>
            <Moon size={15} className="text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">
                Dock at {data.screenTimeSettings.bedtimeCurfew}
              </p>
              <p className="text-[11px] text-muted">
                {data.screenTimeSettings.devicePaused ? "Devices Paused" : "Active & Monitored"}
              </p>
            </div>
            <button
              onClick={handleToggleDevicePause}
              disabled={togglingPause}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition shadow-sm ${
                data.screenTimeSettings.devicePaused
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white"
              }`}
            >
              {data.screenTimeSettings.devicePaused ? (
                <>
                  <PlayCircle size={13} />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <PauseCircle size={13} />
                  <span>Pause</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card 3: Emotional Baseline */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Emotional Pulse (7-Day)</span>
            <TrendingUp size={15} className="text-secondary" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-xl font-bold font-heading text-foreground">
              {data.moodJournal.slice(-1)[0]?.mood || "😊"}
            </span>
            <span className="text-xs text-muted">
              Latest check-in: {data.moodJournal.slice(-1)[0]?.day || todayDay}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {data.moodJournal.filter((m) => m.score >= 4).length} of 7 days logged positive valence
          </p>
        </div>

        {/* Card 4: Referral Rewards Tier */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span>Referral Tier Unlocked</span>
            <Gift size={15} className="text-purple-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-sm font-bold font-heading text-foreground">
              {data.referral.invited >= 5 ? "1 Year Family Upgrade" : "3 Months Premium"}
            </span>
            <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
              {data.referral.invited} Invited
            </span>
          </div>
          <Link
            href="/dashboard/referrals"
            className="mt-1 text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
          >
            <span>Open Referral Hub</span>
            <ChevronRight size={11} />
          </Link>
        </div>
      </div>

      {/* Row 1: Wellbeing Ring & Screen Time Chart (Connected to Backend) */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="flex flex-col items-center justify-center lg:col-span-1 p-6">
          <CardHeader className="w-full px-0 pt-0">
            <CardTitle>Digital Wellbeing Score</CardTitle>
          </CardHeader>
          <WellbeingRing score={data.child.wellbeingScore} trend={data.child.wellbeingTrend} />
          <p className="mt-4 max-w-xs text-center text-xs text-muted">
            Calculated from sleep hygiene, night usage, educational balance, and emotional indicators.
          </p>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Screen Time This Week</CardTitle>
              <p className="text-xs text-muted mt-0.5">
                Live weekly telemetry tracked across Aarav&apos;s iOS devices
              </p>
            </div>
            <Link
              href="/dashboard/screen-time"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage limits →</span>
            </Link>
          </CardHeader>
          <ScreenTimeChart data={data.weeklyScreenTime} />
        </Card>
      </div>

      {/* Row 2: Mood Trend, Top Apps, Top Risk Alert (Connected to Backend) */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Mood Trend */}
        <Card className="lg:col-span-1 p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <CardTitle>Mood Trend</CardTitle>
            <Link href="/dashboard/mood" className="text-xs font-semibold text-primary hover:underline">
              Journal →
            </Link>
          </CardHeader>
          <MoodChart data={data.moodJournal} />
        </Card>

        {/* Top Apps List */}
        <Card className="lg:col-span-1 p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <CardTitle>Top Apps</CardTitle>
            <Link
              href="/dashboard/app-usage"
              className="text-xs font-semibold text-primary hover:underline"
            >
              All apps →
            </Link>
          </CardHeader>
          <div className="flex flex-col gap-3.5">
            {topApps.map((app) => (
              <div key={app.app} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: app.color }} />
                  <div>
                    <span className="text-xs font-bold text-foreground block">{app.app}</span>
                    <span className="text-[10px] text-muted capitalize">
                      {app.category || "General"}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold font-heading">{app.time}</p>
                  <p className="text-[10px] text-muted">{app.percentage}% of screen time</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Risk Signal */}
        <Card className="lg:col-span-1 p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <CardTitle>Active Risk Signals ({data.riskAlerts.length})</CardTitle>
            <Link href="/dashboard/alerts" className="text-xs font-semibold text-primary hover:underline">
              All alerts →
            </Link>
          </CardHeader>
          <RiskAlertCard {...topAlert} onResolve={handleResolveAlert} />
        </Card>
      </div>

      {/* Row 3: Referral Rewards Banner & AI Risk Summary */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Referral Card */}
        <Card className="lg:col-span-1 p-6 flex flex-col justify-between border-purple-500/20 bg-purple-500/5">
          <div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
              <Gift size={18} />
              <h4 className="font-heading text-sm font-bold">Referral Rewards Hub</h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Invite other parents. When they start their trial, you earn free premium months and consultation credits.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-background p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted block">Your Code</span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {data.referral.code}
                </span>
              </div>
              <button
                onClick={handleCopyInviteLink}
                className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-primary/90"
              >
                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedCode ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-muted font-medium">
              {data.referral.invited} Parents Joined
            </span>
            <Link
              href="/dashboard/referrals"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage Invites</span>
              <ChevronRight size={13} />
            </Link>
          </div>
        </Card>

        {/* AI Weekly Summary & Closed Loop Wins */}
        <Card className="lg:col-span-2 p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <CardTitle>AI Risk &amp; Insight Summary</CardTitle>
            <Badge color="var(--secondary)">Heuristic Model v1</Badge>
          </CardHeader>
          <p className="text-sm leading-relaxed text-muted">{data.weeklyReport.summary}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-accent">Wins &amp; Positive Behaviors</p>
              <ul className="space-y-1 text-xs text-muted">
                {data.weeklyReport.wins?.map((w: string) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-warning">Watch-outs &amp; Interventions</p>
              <ul className="space-y-1 text-xs text-muted">
                {data.weeklyReport.watchouts?.map((w: string) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
