"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star, Trophy, Sparkles, Check, Smartphone, CheckCircle2 } from "lucide-react";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { RoleGate } from "@/components/role-gate";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { AvatarCompanion, type AvatarMood } from "@/components/child/avatar-companion";
import { DeviceSimulator } from "@/components/simulator/device-simulator";

const moods = [
  { label: "Happy", emoji: "😊", score: 5 },
  { label: "Okay", emoji: "😐", score: 3 },
  { label: "Sad", emoji: "😔", score: 2 },
  { label: "Angry", emoji: "😡", score: 1 },
  { label: "Sleepy", emoji: "😴", score: 3 },
];

export default function ChildAppPage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [avatarExpression, setAvatarExpression] = useState<AvatarMood>("happy");
  const [avatarNudge, setAvatarNudge] = useState<string | null>(
    "Remember to drink some water and take a 5-minute stretch break! 💧"
  );
  const [streakDays, setStreakDays] = useState(6);
  const [points, setPoints] = useState(480);
  const [savingMood, setSavingMood] = useState(false);
  const [moodSuccess, setMoodSuccess] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [nudgeActionTaken, setNudgeActionTaken] = useState(false);

  useEffect(() => {
    // Load current avatar state and recent mood from backend
    async function loadState() {
      try {
        const res = await fetch("/api/child-coach");
        const data = await res.json();
        if (data.avatarState) {
          setAvatarExpression(data.avatarState.moodExpression || "happy");
          if (data.avatarState.activeNudge) {
            setAvatarNudge(data.avatarState.activeNudge);
          }
          if (data.avatarState.streakDays) {
            setStreakDays(data.avatarState.streakDays);
          }
          if (data.avatarState.rewardPoints) {
            setPoints(data.avatarState.rewardPoints);
          }
        }
      } catch (err) {
        console.error("Failed to load avatar state:", err);
      }
    }
    loadState();
  }, []);

  const handleMoodSelect = async (m: (typeof moods)[0]) => {
    setSelectedMood(m.label);
    setSavingMood(true);
    setMoodSuccess(false);

    // Dynamic avatar expression based on mood
    if (m.score >= 4) {
      setAvatarExpression("happy");
      setPoints((prev) => prev + 15);
    } else if (m.score === 3) {
      setAvatarExpression(m.label === "Sleepy" ? "sleepy" : "thinking");
      setPoints((prev) => prev + 10);
    } else {
      setAvatarExpression("concerned");
      setAvatarNudge(`I'm so glad you shared that with me. It's okay to feel ${m.label.toLowerCase()} sometimes. I'm right here with you! 💙`);
      setPoints((prev) => prev + 10);
    }

    try {
      await fetch("/api/dashboard/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: m.emoji,
          score: m.score,
          note: `Logged from Child Companion: ${m.label}`,
        }),
      });
      setMoodSuccess(true);
      setTimeout(() => setMoodSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save mood log:", err);
    } finally {
      setSavingMood(false);
    }
  };

  const handleTakeNudgeBreak = () => {
    setNudgeActionTaken(true);
    setAvatarExpression("proud");
    setAvatarNudge("Superstar move! Taking deliberate breaks is how champions recharge. 🌟 (+25 points!)");
    setPoints((p) => p + 25);
  };

  return (
    <RoleGate allowedRole="child">
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs">
              AI
            </span>
            <span>KiddoAI Companion</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Smartphone size={13} />
              <span>{showSimulator ? "Hide Emulator" : "Device Emulator"}</span>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Device Emulator Drawer for testing */}
        <AnimatePresence>
          {showSimulator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <DeviceSimulator />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stateful Animated Avatar Companion Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-b from-primary/10 via-card to-card p-6 text-center shadow-lg">
          <AvatarCompanion
            name="Aarav"
            expression={avatarExpression}
            nudge={avatarNudge}
            streakDays={streakDays}
            points={points}
          />

          {/* Quick Positive Habit Action Button */}
          {!nudgeActionTaken && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTakeNudgeBreak}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-sky-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:shadow-lg"
            >
              <Check size={14} />
              <span>I&apos;ll take a 5-minute screen break! (+25 pts)</span>
            </motion.button>
          )}
        </Card>

        {/* Daily Mood Check-in with Backend Persistence */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">How are you feeling today?</CardTitle>
              {moodSuccess && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                  <CheckCircle2 size={13} />
                  <span>Saved to your wellness journal!</span>
                </span>
              )}
            </div>
          </CardHeader>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 p-4 pt-0">
            {moods.map((m) => (
              <button
                key={m.label}
                disabled={savingMood}
                onClick={() => handleMoodSelect(m)}
                className={`flex flex-col items-center justify-center min-h-16 rounded-xl border p-3 text-sm font-semibold transition ${
                  selectedMood === m.label
                    ? "scale-105 border-primary bg-primary/15 text-primary shadow-sm"
                    : "border-border bg-card/40 hover:scale-105 hover:bg-card"
                }`}
              >
                <span className="text-2xl mb-1">{m.emoji}</span>
                <span className="text-xs">{m.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Gamified Wellness Streaks */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-xl border border-border bg-card/60 p-4">
            <Flame size={20} className="text-warning fill-warning" />
            <p className="mt-1 text-sm font-semibold">{streakDays} days</p>
            <p className="text-xs text-muted">Daily Streak</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-border bg-card/60 p-4">
            <Trophy size={20} className="text-accent" />
            <p className="mt-1 text-sm font-semibold">12 Unlocked</p>
            <p className="text-xs text-muted">Achievements</p>
          </div>
          <div className="flex flex-col items-center rounded-xl border border-border bg-card/60 p-4">
            <Star size={20} className="text-primary fill-primary" />
            <p className="mt-1 text-sm font-semibold">{points}</p>
            <p className="text-xs text-muted">Reward Points</p>
          </div>
        </div>

        {/* Chat with Kiddo AI Coach */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Chat with Kiddo</CardTitle>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                Safe &amp; Age-Appropriate
              </span>
            </div>
          </CardHeader>
          <div className="p-4 pt-0">
            <ChatPanel
              endpoint="/api/child-coach"
              assistantName="Kiddo"
              placeholder="Ask Kiddo anything about homework, sleep, friends, or hobbies..."
              bubbleAssistantClass="bg-primary/10 border border-primary/20 text-foreground"
              starterPrompts={[
                "I'm stressed about homework",
                "Someone was mean to me at school",
                "I can't sleep tonight",
                "I need motivation for today",
              ]}
            />
          </div>
        </Card>
      </div>
    </RoleGate>
  );
}
