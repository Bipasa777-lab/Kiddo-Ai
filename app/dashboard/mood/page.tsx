"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MoodChart } from "@/components/dashboard/mood-chart";
import { moodJournal as fallbackMoods } from "@/lib/mock-data";
import {
  Smile,
  CheckCircle2,
  RefreshCw,
  Heart,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Trash2,
} from "lucide-react";

const moodOptions = [
  { emoji: "😊", label: "Happy", score: 5 },
  { emoji: "😐", label: "Okay", score: 3 },
  { emoji: "😔", label: "Low", score: 2 },
  { emoji: "😡", label: "Frustrated", score: 1 },
  { emoji: "😴", label: "Exhausted", score: 2 },
];

export interface MoodRecord {
  id?: string;
  day: string;
  mood: string;
  score: number;
  note?: string;
  date?: string;
}

export default function MoodPage() {
  const [moods, setMoods] = useState<MoodRecord[]>(fallbackMoods);
  const [customNote, setCustomNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stats, setStats] = useState({ avgScore: 3.8, happyPct: 71, totalLogs: 7 });

  const fetchMoods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/mood", { cache: "no-store" });
      const data = await res.json();
      if (data.moodJournal) {
        setMoods(data.moodJournal);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch moods:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  const handleLogMood = async (m: (typeof moodOptions)[0]) => {
    try {
      setSaving(true);
      await fetch("/api/dashboard/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: m.emoji,
          score: m.score,
          note: customNote.trim() || `Parent observed mood: ${m.label}`,
        }),
      });
      setSuccess(true);
      setCustomNote("");
      await fetchMoods();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error logging mood:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMood = async (id?: string) => {
    if (!id) return;
    try {
      await fetch(`/api/dashboard/mood?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await fetchMoods();
    } catch (err) {
      console.error("Error deleting mood entry:", err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Mood &amp; Emotional Wellness Journal
          </h1>
          <p className="mt-1 text-sm text-muted">
            Daily check-ins, emotional valence trajectory, and AI behavior-to-mood correlations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchMoods}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-background shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Sync Journal</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Average Valence Score</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">{stats.avgScore}</span>
            <span className="text-xs text-muted">/ 5.0</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Healthy emotional baseline</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Positive Days Share</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-foreground">{stats.happyPct}%</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Positive
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Ratings scored Happy or Calm</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">Today&apos;s Check-in</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl">{moods.slice(-1)[0]?.mood || "😊"}</span>
            <span className="text-xs font-bold text-foreground">
              {moods.slice(-1)[0]?.day || "Today"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted truncate">
            {moods.slice(-1)[0]?.note || "Active offline check-in recorded"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-xs font-semibold text-muted">AI Companion Sync</span>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-sm font-bold text-foreground">Kiddo Coach Live</span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Synced
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Nudges adapt dynamically to mood</p>
        </div>
      </div>

      {/* 7-Day Emotional Trend Chart (Dynamic Backend Data) */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <div>
            <CardTitle>7-Day Emotional Trajectory</CardTitle>
            <p className="text-xs text-muted mt-0.5">
              Reflects both family check-ins and AI Coach check-in reflections
            </p>
          </div>
          <span className="text-xs font-semibold text-muted">Scale 1 (Low) – 5 (Happy)</span>
        </CardHeader>
        <MoodChart data={moods} />
      </Card>

      {/* Log Check-in Form & History Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Check-in Form */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Log Family Observation</CardTitle>
              <p className="text-xs text-muted mt-0.5">
                Record your real-world observations from dinner, school pick-up, or bedtime.
              </p>
            </div>
            {success && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={13} />
                <span>Saved!</span>
              </span>
            )}
          </CardHeader>

          <div className="grid grid-cols-5 gap-2 my-4">
            {moodOptions.map((opt) => (
              <button
                key={opt.label}
                disabled={saving}
                onClick={() => handleLogMood(opt)}
                className="flex flex-col items-center justify-center rounded-2xl border border-border p-3 transition hover:border-primary hover:bg-primary/5 active:scale-95 disabled:opacity-50"
              >
                <span className="text-3xl mb-1.5">{opt.emoji}</span>
                <span className="text-[11px] font-bold text-foreground">{opt.label}</span>
                <span className="text-[9px] text-muted">{opt.score}/5</span>
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted block mb-1">
              Add Observation Notes (Optional)
            </label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Happy and animated after soccer practice; relaxed at bedtime"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
            />
          </div>
        </Card>

        {/* Recent History */}
        <Card className="p-6">
          <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
            <CardTitle>Recent Check-in History</CardTitle>
            <span className="text-xs text-muted font-medium">{moods.length} entries</span>
          </CardHeader>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {moods
              .slice()
              .reverse()
              .map((m, idx) => (
                <div
                  key={m.id || idx}
                  className="flex items-center justify-between rounded-xl border border-border p-3 bg-card/60 hover:bg-card transition shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl shrink-0">{m.mood}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{m.day}</span>
                        <span className="text-[10px] text-muted">Score: {m.score}/5</span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-1">{m.note || "Observation logged"}</p>
                    </div>
                  </div>

                  {m.id && (
                    <button
                      onClick={() => handleDeleteMood(m.id)}
                      className="rounded-lg p-1 text-muted hover:text-danger transition"
                      title="Delete entry"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* AI Emotional Correlation Insights */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <CardTitle>AI Emotional Pattern Insights</CardTitle>
          <span className="rounded-full bg-secondary/15 px-2.5 py-0.5 text-xs font-bold text-secondary">
            Behavioral Cross-Check
          </span>
        </CardHeader>
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-bold text-foreground">Behavioral correlation: </span>
          Lower mood ratings correlate strongly with late-night screen activity (logged past 12:15 AM).
          When devices were docked before 10:00 PM, daytime mood ratings improved consistently to Happy (4–5/5).
          Maintaining a calm, screen-free 30-minute reading or wind-down window is recommended to stabilize emotional regulation.
        </p>
      </Card>
    </div>
  );
}
