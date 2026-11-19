"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { MoodChart } from "@/components/dashboard/mood-chart";
import { moodJournal as fallbackMoods } from "@/lib/mock-data";
import { Smile, CheckCircle2, RefreshCw } from "lucide-react";

const moodOptions = [
  { emoji: "😊", label: "Happy", score: 5 },
  { emoji: "😐", label: "Okay", score: 3 },
  { emoji: "😔", label: "Low", score: 2 },
  { emoji: "😡", label: "Frustrated", score: 1 },
  { emoji: "😴", label: "Exhausted", score: 2 },
];

export default function MoodPage() {
  const [moods, setMoods] = useState(fallbackMoods);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchMoods = async () => {
    try {
      const res = await fetch("/api/dashboard/mood");
      const data = await res.json();
      if (data.moodJournal) {
        setMoods(data.moodJournal);
      }
    } catch (err) {
      console.error("Failed to fetch moods:", err);
    }
  };

  useEffect(() => {
    fetchMoods();
  }, []);

  const handleLogMood = async (m: (typeof moodOptions)[0]) => {
    try {
      setSaving(true);
      await fetch("/api/dashboard/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: m.emoji,
          score: m.score,
          note: `Parent observed mood: ${m.label}`,
        }),
      });
      setSuccess(true);
      await fetchMoods();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error logging mood:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Mood & Emotional Journal"
        subtitle="Daily emoji check-ins, emotional valence, and AI pattern detection."
      />

      <Card>
        <CardHeader>
          <CardTitle>7-Day Emotional Trend</CardTitle>
        </CardHeader>
        <MoodChart />
      </Card>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Log Today&apos;s Family Check-in</CardTitle>
              {success && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                  <CheckCircle2 size={13} />
                  <span>Saved!</span>
                </span>
              )}
            </div>
          </CardHeader>
          <p className="text-xs text-muted mb-3">
            Add a quick observation from your offline interactions with your child today:
          </p>
          <div className="grid grid-cols-5 gap-2">
            {moodOptions.map((opt) => (
              <button
                key={opt.label}
                disabled={saving}
                onClick={() => handleLogMood(opt)}
                className="flex flex-col items-center justify-center rounded-xl border border-border p-3 transition hover:border-primary hover:bg-primary/5 active:scale-95"
              >
                <span className="text-2xl mb-1">{opt.emoji}</span>
                <span className="text-[11px] font-medium text-muted">{opt.label}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Check-in History</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-7 gap-2 text-center">
            {moods.slice(-7).map((m, idx) => (
              <div key={idx} className="rounded-xl border border-border p-3 bg-card/40">
                <p className="text-2xl">{m.mood}</p>
                <p className="mt-1 text-xs text-muted font-medium">{m.day}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>AI Emotional Pattern Insights</CardTitle>
        </CardHeader>
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-foreground">Behavioral correlation: </span>
          Lower mood scores (Wednesday and Sunday) strongly correlated with late-night screen activity (logged past 12:15 AM).
          When devices were put to rest before 10:00 PM (Monday, Thursday, Saturday), mood ratings improved to Happy (4–5/5).
          Maintaining a calm, screen-free 30-minute reading or wind-down window is recommended to stabilize emotional regulation.
        </p>
      </Card>
    </div>
  );
}
