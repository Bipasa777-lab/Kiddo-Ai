"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AppUsageChart } from "@/components/dashboard/app-usage-chart";
import { Badge } from "@/components/ui/badge";
import {
  AppWindow,
  RefreshCw,
  Plus,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  Ban,
  ShieldCheck,
  Send,
  Loader2,
} from "lucide-react";
import { appUsage as fallbackAppUsage } from "@/lib/mock-data";

export interface AppItem {
  app: string;
  time: string;
  minutes: number;
  percentage: number;
  color: string;
  category?: string;
  dailyLimitMinutes?: number;
  isBlocked?: boolean;
}

export default function AppUsagePage() {
  const [apps, setApps] = useState<AppItem[]>(fallbackAppUsage);
  const [totalHours, setTotalHours] = useState(7.1);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Simulation form
  const [simApp, setSimApp] = useState("YouTube");
  const [simMinutes, setSimMinutes] = useState(30);
  const [simCategory, setSimCategory] = useState("entertainment");
  const [simulating, setSimulating] = useState(false);

  // Limit editing state
  const [selectedAppForLimit, setSelectedAppForLimit] = useState<AppItem | null>(null);
  const [newLimitMinutes, setNewLimitMinutes] = useState(120);
  const [savingLimit, setSavingLimit] = useState(false);

  const fetchAppUsage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/app-usage", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.appUsage) {
        setApps(json.appUsage);
        if (json.totalHours !== undefined) setTotalHours(json.totalHours);
      }
    } catch (err) {
      console.error("Failed to fetch app usage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppUsage();
  }, [fetchAppUsage]);

  const handleSimulateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulating(true);
      const res = await fetch("/api/dashboard/app-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: simApp,
          minutes: simMinutes,
          category: simCategory,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`Logged ${simMinutes}m session for ${simApp}!`);
        await fetchAppUsage();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Error simulating app usage:", err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveLimit = async () => {
    if (!selectedAppForLimit) return;
    try {
      setSavingLimit(true);
      const res = await fetch("/api/dashboard/app-usage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: selectedAppForLimit.app,
          dailyLimitMinutes: newLimitMinutes,
          isBlocked: selectedAppForLimit.isBlocked || false,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`Saved ${newLimitMinutes}m limit for ${selectedAppForLimit.app}.`);
        setSelectedAppForLimit(null);
        await fetchAppUsage();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Error saving app limit:", err);
    } finally {
      setSavingLimit(false);
    }
  };

  const handleToggleBlock = async (appItem: AppItem) => {
    try {
      const res = await fetch("/api/dashboard/app-usage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app: appItem.app,
          dailyLimitMinutes: appItem.dailyLimitMinutes || 120,
          isBlocked: !appItem.isBlocked,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(`${appItem.app} is now ${!appItem.isBlocked ? "Blocked" : "Unblocked"}.`);
        await fetchAppUsage();
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error("Error toggling block:", err);
    }
  };

  const topApp = apps[0] || { app: "YouTube", percentage: 32 };

  return (
    <div className="space-y-6 pb-12">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            App Usage Analytics &amp; Time Allocations
          </h1>
          <p className="mt-1 text-sm text-muted">
            Inspect which apps receive the most focus, set daily app caps, and enforce healthy digital habits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAppUsage}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-background shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Sync Usage</span>
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

      {/* 4 Stat Metric Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Total App Screen Time</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">{totalHours}h</span>
            <span className="text-xs text-muted">active</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Across {apps.length} tracked applications</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Top App Concentration</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">{topApp.app}</span>
            <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold text-danger">
              {topApp.percentage}% of time
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Highest engagement this week</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Educational Apps</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">
              {apps.find((a) => a.app.toLowerCase().includes("classroom"))?.time || "35m"}
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Google Classroom &amp; Study apps</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Apps with Restrictions</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">
              {apps.filter((a) => a.dailyLimitMinutes || a.isBlocked).length} Apps
            </span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Guarded
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Time limits and app blockers enabled</p>
        </div>
      </div>

      {/* Row 1: Pie Chart & App Details List */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Usage Distribution Share</CardTitle>
            <p className="text-xs text-muted mt-0.5">
              Live breakdown computed from persistent database records
            </p>
          </CardHeader>
          <AppUsageChart data={apps} />
        </Card>

        {/* Apps List */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <CardTitle>Application Directory &amp; Limits</CardTitle>
            <span className="text-xs text-muted font-medium">{apps.length} Apps Tracked</span>
          </CardHeader>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {apps.map((app) => (
              <div
                key={app.app}
                className="flex items-center justify-between rounded-xl border border-border p-3.5 bg-card/60 hover:bg-card transition shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: app.color }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{app.app}</span>
                      {app.isBlocked && (
                        <span className="rounded-md bg-danger/15 px-1.5 py-0.2 text-[9px] font-bold text-danger">
                          Blocked
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted capitalize">
                      {app.category || "General"} · {app.dailyLimitMinutes ? `Cap: ${app.dailyLimitMinutes}m` : "No limit"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs font-bold font-heading">{app.time}</p>
                    <p className="text-[10px] text-muted">{app.percentage}%</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedAppForLimit(app);
                        setNewLimitMinutes(app.dailyLimitMinutes || 90);
                      }}
                      className="rounded-lg border border-border p-1.5 text-muted hover:border-primary/40 hover:text-primary transition"
                      title="Configure Daily Limit"
                    >
                      <Sliders size={13} />
                    </button>
                    <button
                      onClick={() => handleToggleBlock(app)}
                      className={`rounded-lg border p-1.5 transition ${
                        app.isBlocked
                          ? "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
                          : "border-border text-muted hover:border-danger/40 hover:text-danger"
                      }`}
                      title={app.isBlocked ? "Unblock App" : "Block App"}
                    >
                      <Ban size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2: Limit Editor Modal / Form & Simulator Box */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* App Limit Configuration Box */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sliders size={18} className="text-primary" />
            <CardTitle>
              {selectedAppForLimit ? `Set Daily Cap for ${selectedAppForLimit.app}` : "App Limit Manager"}
            </CardTitle>
          </div>

          {selectedAppForLimit ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Daily Allowance: {newLimitMinutes} Minutes ({Math.round((newLimitMinutes / 60) * 10) / 10} Hours)
                </label>
                <input
                  type="range"
                  min="15"
                  max="240"
                  step="15"
                  value={newLimitMinutes}
                  onChange={(e) => setNewLimitMinutes(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted mt-1">
                  <span>15m Strict</span>
                  <span>60m (1h)</span>
                  <span>120m (2h)</span>
                  <span>240m (4h)</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAppForLimit(null)}
                  className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveLimit}
                  disabled={savingLimit}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {savingLimit ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Save Limit</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
              <Sliders size={24} className="mx-auto mb-2 text-primary/60" />
              <p className="text-xs font-medium">Click the slider icon next to any app above to adjust its daily time allowance.</p>
            </div>
          )}
        </Card>

        {/* Telemetry Simulator Form */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Send size={18} className="text-primary" />
            <CardTitle>Simulate App Usage Telemetry</CardTitle>
          </div>

          <form onSubmit={handleSimulateApp} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Select App</label>
                <select
                  value={simApp}
                  onChange={(e) => setSimApp(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                >
                  {apps.map((a) => (
                    <option key={a.app} value={a.app}>
                      {a.app}
                    </option>
                  ))}
                  <option value="Duolingo">Duolingo 🦉 (New)</option>
                  <option value="Roblox">Roblox 🎮 (New)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Session Duration</label>
                <select
                  value={simMinutes}
                  onChange={(e) => setSimMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Category</label>
              <select
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
              >
                <option value="entertainment">Entertainment 🍿</option>
                <option value="gaming">Gaming 🎮</option>
                <option value="social">Social Media 💬</option>
                <option value="education">Education 📚</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus size={14} />
              <span>{simulating ? "Logging..." : "Log App Usage Session"}</span>
            </button>
          </form>
        </Card>
      </div>

      {/* AI Behavioral Insights Summary */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <CardTitle>AI Behavioral Pattern Insights</CardTitle>
          <Badge color="var(--secondary)">Heuristic Model v1</Badge>
        </CardHeader>
        <ul className="space-y-2 text-xs text-muted leading-relaxed">
          <li>
            • <span className="font-semibold text-foreground">Video streaming: </span>
            YouTube usage is concentrated in the early evenings (5:00 PM – 7:30 PM). Total consumption remains within weekly limits.
          </li>
          <li>
            • <span className="font-semibold text-foreground">Educational apps: </span>
            Google Classroom engagement averaged 35 minutes daily, concentrated during weekday afternoons.
          </li>
          <li>
            • <span className="font-semibold text-foreground">Gaming balance: </span>
            Minecraft sessions remain stable at ~40 minutes, with no continuous gaming flags exceeding the 2.5-hour threshold.
          </li>
        </ul>
      </Card>
    </div>
  );
}
