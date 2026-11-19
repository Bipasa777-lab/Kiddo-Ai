"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Moon,
  Gamepad2,
  AlertTriangle,
  GraduationCap,
  MapPin,
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  HeartHandshake,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SimulationPreset {
  id: string;
  name: string;
  icon: typeof Moon;
  description: string;
  badge: string;
  badgeColor: string;
  event: {
    eventType: "app_session" | "night_activity" | "chat_message" | "safe_zone";
    appName: string;
    durationMinutes: number;
    hourOfDay: number;
    category: "education" | "social" | "gaming" | "entertainment" | "utility";
    sentimentText?: string;
    locationEvent?: string;
  };
}

const PRESETS: SimulationPreset[] = [
  {
    id: "late_night",
    name: "Late-Night Doomscrolling",
    icon: Moon,
    description: "Screen activity past 1:30 AM on YouTube (75 mins continuous).",
    badge: "Sleep Risk",
    badgeColor: "var(--danger)",
    event: {
      eventType: "night_activity",
      appName: "YouTube",
      durationMinutes: 75,
      hourOfDay: 1,
      category: "entertainment",
      sentimentText: "Watching videos late at night because I can't sleep",
    },
  },
  {
    id: "gaming_surge",
    name: "Weekend Gaming Marathon",
    icon: Gamepad2,
    description: "3.5 hours uninterrupted session on Minecraft/Roblox.",
    badge: "Gaming Alert",
    badgeColor: "var(--warning)",
    event: {
      eventType: "app_session",
      appName: "Minecraft",
      durationMinutes: 210,
      hourOfDay: 15,
      category: "gaming",
    },
  },
  {
    id: "cyberbullying",
    name: "Distress / Bullying Flag",
    icon: AlertTriangle,
    description: "Distressing peer interaction text pattern flagged by NLP filter.",
    badge: "Critical Alert",
    badgeColor: "#F43F5E",
    event: {
      eventType: "chat_message",
      appName: "WhatsApp",
      durationMinutes: 25,
      hourOfDay: 19,
      category: "social",
      sentimentText: "Everyone at school hates me and I was crying alone at lunch",
    },
  },
  {
    id: "study_win",
    name: "Positive Study Session",
    icon: GraduationCap,
    description: "Focused 45-minute homework session on Google Classroom.",
    badge: "Positive Win",
    badgeColor: "var(--accent)",
    event: {
      eventType: "app_session",
      appName: "Google Classroom",
      durationMinutes: 45,
      hourOfDay: 16,
      category: "education",
    },
  },
  {
    id: "safe_zone",
    name: "Safe Zone Check-in",
    icon: MapPin,
    description: "Child successfully arrived at Home safe zone at 5:45 PM.",
    badge: "Location",
    badgeColor: "var(--primary)",
    event: {
      eventType: "safe_zone",
      appName: "Kiddo Tracker",
      durationMinutes: 10,
      hourOfDay: 17,
      category: "utility",
      locationEvent: "Reached Home",
    },
  },
];

export function DeviceSimulator({ onEventProcessed }: { onEventProcessed?: () => void }) {
  const [selectedPreset, setSelectedPreset] = useState<string>("late_night");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customApp, setCustomApp] = useState("TikTok");
  const [customDuration, setCustomDuration] = useState("60");
  const [customHour, setCustomHour] = useState("23");
  const [customSentiment, setCustomSentiment] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any | null>(null);

  const activePreset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  const handleSimulate = async () => {
    setLoading(true);
    setLastResult(null);

    const eventPayload = isCustomMode
      ? {
          eventType: "app_session",
          appName: customApp,
          durationMinutes: Number(customDuration) || 30,
          hourOfDay: Number(customHour) || 12,
          sentimentText: customSentiment || undefined,
        }
      : activePreset.event;

    try {
      const res = await fetch("/api/telemetry/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventPayload),
      });

      const data = await res.json();
      setLastResult(data);
      if (onEventProcessed) {
        onEventProcessed();
      }
    } catch (err) {
      console.error("Simulation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-card to-background shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Smartphone size={18} />
            </div>
            <div>
              <CardTitle className="text-base">Device Telemetry & Risk Simulator</CardTitle>
              <p className="text-xs text-muted">Test real-time signals, ML heuristics, and the parallel intervention loop.</p>
            </div>
          </div>
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            <button
              onClick={() => setIsCustomMode(false)}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                !isCustomMode ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Presets
            </button>
            <button
              onClick={() => setIsCustomMode(true)}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                isCustomMode ? "bg-primary text-white" : "text-muted hover:text-foreground"
              }`}
            >
              Custom
            </button>
          </div>
        </div>
      </CardHeader>

      <div className="p-4 pt-0">
        {!isCustomMode ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-card/40 hover:border-border/80 hover:bg-card/80"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className={isSelected ? "text-primary" : "text-muted"} />
                      <span className="text-xs font-semibold">{preset.name}</span>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: `${preset.badgeColor}20`, color: preset.badgeColor }}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted line-clamp-2">{preset.description}</p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs text-muted">App Name</label>
              <input
                type="text"
                value={customApp}
                onChange={(e) => setCustomApp(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                placeholder="e.g. YouTube, Instagram, Minecraft"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted">Duration (mins)</label>
                <input
                  type="number"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted">Hour (0–23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customHour}
                  onChange={(e) => setCustomHour(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted">Sentiment / Chat Message Text (Optional)</label>
              <input
                type="text"
                value={customSentiment}
                onChange={(e) => setCustomSentiment(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs"
                placeholder="e.g. 'I'm so stressed about tomorrow' or 'Can't sleep'"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
          <p className="text-[11px] text-muted">
            Simulates device SDK event injection directly into the backend Risk & Insight Engine.
          </p>
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Simulate Device Event</span>
              </>
            )}
          </button>
        </div>

        {/* Live Closed-Loop Pipeline Feedback Result */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                <div className="flex items-center gap-2 font-bold text-primary">
                  <CheckCircle2 size={16} />
                  <span>Pipeline Execution Result (Figure 2 Flow)</span>
                </div>
                <Badge
                  color={
                    lastResult.evaluation?.riskLevel === "critical" || lastResult.evaluation?.riskLevel === "high"
                      ? "var(--danger)"
                      : lastResult.evaluation?.riskLevel === "medium"
                      ? "var(--warning)"
                      : "var(--accent)"
                  }
                >
                  {lastResult.evaluation?.riskLevel.toUpperCase()} RISK (Confidence: {lastResult.evaluation?.confidence}%)
                </Badge>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-border/80 bg-background/80 p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-secondary mb-1">
                    <Sparkles size={13} />
                    <span>Parallel Dispatch 1: Child AI Coach</span>
                  </div>
                  <p className="text-muted leading-relaxed">
                    {lastResult.evaluation?.coachNudge || "No active intervention needed."}
                  </p>
                </div>

                <div className="rounded-lg border border-border/80 bg-background/80 p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                    <HeartHandshake size={13} />
                    <span>Parallel Dispatch 2: Parent Offline Action</span>
                  </div>
                  <p className="text-muted leading-relaxed">
                    {lastResult.evaluation?.parentActionAdvice || "Standard daily digital balance maintained."}
                  </p>
                </div>
              </div>

              {lastResult.evaluation?.researchCitation && (
                <div className="mt-2 text-[10px] text-muted italic">
                  Research Foundation: {lastResult.evaluation.researchCitation}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
