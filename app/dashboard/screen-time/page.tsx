"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ScreenTimeChart } from "@/components/dashboard/screen-time-chart";
import {
  Clock,
  RefreshCw,
  Plus,
  PauseCircle,
  PlayCircle,
  Moon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Send,
} from "lucide-react";
import { weeklyScreenTime as fallbackWeeklyScreenTime } from "@/lib/mock-data";

interface ScreenTimeDayData {
  day: string;
  hours: number;
  education: number;
  social: number;
  gaming: number;
  entertainment: number;
}

interface ScreenTimeSettings {
  dailyLimitHours: number;
  bedtimeCurfew: string;
  devicePaused: boolean;
}

export default function ScreenTimePage() {
  const [weeklyData, setWeeklyData] = useState<ScreenTimeDayData[]>(fallbackWeeklyScreenTime);
  const [settings, setSettings] = useState<ScreenTimeSettings>({
    dailyLimitHours: 4.5,
    bedtimeCurfew: "21:30",
    devicePaused: false,
  });
  const [grandTotal, setGrandTotal] = useState(37.8);
  const [averageDaily, setAverageDaily] = useState(5.4);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Quick session logging state
  const [logCategory, setLogCategory] = useState<"education" | "social" | "gaming" | "entertainment">("education");
  const [logHours, setLogHours] = useState(1.0);
  const [logAppName, setLogAppName] = useState("Google Classroom");
  const [loggingSession, setLoggingSession] = useState(false);

  const fetchScreenTime = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/screen-time", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        if (json.weeklyScreenTime) setWeeklyData(json.weeklyScreenTime);
        if (json.settings) setSettings(json.settings);
        if (json.grandTotal !== undefined) setGrandTotal(json.grandTotal);
        if (json.averageDaily !== undefined) setAverageDaily(json.averageDaily);
      }
    } catch (err) {
      console.error("Failed to fetch screen time data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreenTime();
  }, [fetchScreenTime]);

  const handleUpdateSettings = async (newSettings: Partial<ScreenTimeSettings>) => {
    try {
      setSavingSettings(true);
      const res = await fetch("/api/dashboard/screen-time", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
        setFeedback("Screen time controls saved successfully.");
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Error updating settings:", err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoggingSession(true);
      const res = await fetch("/api/dashboard/screen-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: logCategory,
          hours: logHours,
          appName: logAppName,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`Added ${logHours}h of ${logCategory} session!`);
        await fetchScreenTime();
        setTimeout(() => setFeedback(null), 3500);
      }
    } catch (err) {
      console.error("Error logging screen session:", err);
    } finally {
      setLoggingSession(false);
    }
  };

  const categories = [
    { key: "education", label: "Education", color: "var(--primary)" },
    { key: "social", label: "Social Media", color: "#EC4899" },
    { key: "gaming", label: "Gaming", color: "var(--accent)" },
    { key: "entertainment", label: "Entertainment", color: "var(--warning)" },
  ] as const;

  const totals = categories.map((c) => ({
    ...c,
    total: Number(weeklyData.reduce((sum, d) => sum + (d[c.key] || 0), 0).toFixed(1)),
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Screen Time Monitor &amp; Device Curfew
          </h1>
          <p className="mt-1 text-sm text-muted">
            Daily limits, live category breakdown, and automated bedtime dock schedule.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchScreenTime}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-background shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={15} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Screen Time Telemetry Strip (4 Stat Cards) */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Total Screen Time (7d)</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">{grandTotal}h</span>
            <span className="text-xs text-muted">tracked</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Averages {averageDaily} hours per day</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Daily Limit Cap</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">
              {settings.dailyLimitHours}h
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Active Guard
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Nudges child when nearing limit</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Bedtime Dock Curfew</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">
              {settings.bedtimeCurfew}
            </span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              Evening Dock
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Enforces night wind-down routine</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Device Access State</span>
          <div className="mt-2.5 flex items-center justify-between">
            <span
              className={`text-sm font-bold capitalize ${
                settings.devicePaused ? "text-danger" : "text-emerald-500"
              }`}
            >
              {settings.devicePaused ? "Devices Paused ⏸️" : "Unlocked & Monitored 📱"}
            </span>
            <button
              onClick={() => handleUpdateSettings({ devicePaused: !settings.devicePaused })}
              disabled={savingSettings}
              className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                settings.devicePaused
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-danger text-white hover:bg-danger/90"
              }`}
            >
              {settings.devicePaused ? "Resume" : "Pause"}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-muted">Instant remote lock from parent app</p>
        </div>
      </div>

      {/* Screen Time Chart (Live Backend Data) */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Weekly Screen Time Trend</CardTitle>
            <p className="text-xs text-muted mt-0.5">
              Synced continuously from iOS Screen Time telemetry records
            </p>
          </div>
          <span className="text-xs font-bold font-mono text-muted">
            Average: {averageDaily}h/day
          </span>
        </CardHeader>
        <ScreenTimeChart data={weeklyData} />
      </Card>

      {/* Two Column Grid: Category Breakdown & Daily Table */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Breakdown */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {totals.map((c) => {
              const pct = grandTotal > 0 ? ((c.total / grandTotal) * 100).toFixed(0) : "0";
              return (
                <div key={c.key}>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold">
                    <span className="text-foreground">{c.label}</span>
                    <span className="text-muted">
                      {c.total}h ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-background border border-border/50">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted leading-relaxed">
            <span className="font-bold text-foreground">Healthy habit baseline: </span>
            Aim for education to remain above 25% of total screen allocation, with gaming kept under 35%.
          </div>
        </Card>

        {/* Daily Breakdown Table */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <CardTitle>Daily Telemetry Records</CardTitle>
            <span className="text-xs text-muted font-medium">Last 7 Days</span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted">
                  <th className="pb-2 font-semibold">Day</th>
                  <th className="pb-2 font-semibold">Total</th>
                  <th className="pb-2 font-semibold">Education</th>
                  <th className="pb-2 font-semibold">Gaming</th>
                  <th className="pb-2 font-semibold">Social</th>
                </tr>
              </thead>
              <tbody>
                {weeklyData.map((d) => (
                  <tr key={d.day} className="border-b border-border/40 hover:bg-card/60 transition">
                    <td className="py-2.5 font-bold text-foreground">{d.day}</td>
                    <td className="py-2.5 font-bold font-heading">{d.hours}h</td>
                    <td className="py-2.5 text-primary">{d.education}h</td>
                    <td className="py-2.5 text-accent">{d.gaming}h</td>
                    <td className="py-2.5 text-pink-500">{d.social}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Control Settings & Session Logger Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Settings Box */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={18} className="text-primary" />
            <CardTitle>Screen Time Guardrails</CardTitle>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-foreground mb-1">
                <span>Daily Screen Limit: {settings.dailyLimitHours} Hours</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="8.0"
                step="0.5"
                value={settings.dailyLimitHours}
                onChange={(e) =>
                  handleUpdateSettings({ dailyLimitHours: Number(e.target.value) })
                }
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>1.5h Strict</span>
                <span>4.5h Recommended</span>
                <span>8.0h Relaxed</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Bedtime Curfew (Device Dock Time)
              </label>
              <select
                value={settings.bedtimeCurfew}
                onChange={(e) => handleUpdateSettings({ bedtimeCurfew: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              >
                <option value="20:30">8:30 PM (Early Wind-down)</option>
                <option value="21:00">9:00 PM (Recommended School Nights)</option>
                <option value="21:30">9:30 PM (Standard)</option>
                <option value="22:00">10:00 PM (Weekend Cap)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Quick Session Logger Form (Backend Interactive) */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Send size={18} className="text-primary" />
            <CardTitle>Simulate / Log Screen Time Event</CardTitle>
          </div>

          <form onSubmit={handleLogSession} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Category</label>
                <select
                  value={logCategory}
                  onChange={(e) =>
                    setLogCategory(e.target.value as "education" | "social" | "gaming" | "entertainment")
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                >
                  <option value="education">Education 📚</option>
                  <option value="gaming">Gaming 🎮</option>
                  <option value="social">Social Media 💬</option>
                  <option value="entertainment">Entertainment 🍿</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Duration (Hours)</label>
                <select
                  value={logHours}
                  onChange={(e) => setLogHours(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                >
                  <option value={0.5}>0.5h (30 mins)</option>
                  <option value={1.0}>1.0h (60 mins)</option>
                  <option value={1.5}>1.5h (90 mins)</option>
                  <option value={2.0}>2.0h (120 mins)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted block mb-1">App Name</label>
              <input
                type="text"
                value={logAppName}
                onChange={(e) => setLogAppName(e.target.value)}
                placeholder="e.g. Google Classroom, Minecraft, YouTube"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loggingSession}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{loggingSession ? "Updating..." : "Log Screen Time Session"}</span>
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
