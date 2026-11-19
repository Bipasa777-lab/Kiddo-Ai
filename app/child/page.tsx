"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Star,
  Trophy,
  Sparkles,
  Check,
  Smartphone,
  CheckCircle2,
  Clock,
  Moon,
  MapPin,
  PauseCircle,
  X,
  Award,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
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

export interface ChallengeItem {
  id: string;
  title: string;
  desc: string;
  points: number;
  icon: string;
  completed: boolean;
  category: "habit" | "movement" | "learning" | "rest";
}

export interface AchievementItem {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  points: number;
  progress?: string;
}

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
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);

  // Live backend dashboard state
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [todayScreenTime, setTodayScreenTime] = useState({
    usedHours: 4.2,
    limitHours: 4.5,
    remainingHours: 0.3,
    percentUsed: 93,
    curfewTime: "21:30",
    devicePaused: false,
  });
  const [currentLocation, setCurrentLocation] = useState({
    placeName: "Home",
    status: "inside_safe_zone",
  });
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch("/api/child/dashboard", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        if (data.avatarState) {
          setAvatarExpression(data.avatarState.moodExpression || "happy");
          if (data.avatarState.activeNudge) setAvatarNudge(data.avatarState.activeNudge);
          if (data.avatarState.streakDays) setStreakDays(data.avatarState.streakDays);
          if (data.avatarState.rewardPoints !== undefined) setPoints(data.avatarState.rewardPoints);
        }
        if (data.challenges) setChallenges(data.challenges);
        if (data.achievements) setAchievements(data.achievements);
        if (data.todayScreenTime) setTodayScreenTime(data.todayScreenTime);
        if (data.currentLocation) setCurrentLocation(data.currentLocation);
      }
    } catch (err) {
      console.error("Failed to load child dashboard:", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle tapping on the avatar character
  const handleTapAvatar = async () => {
    try {
      const res = await fetch("/api/child/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "tap_avatar" }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setAvatarNudge(data.message);
        if (data.rewardPoints !== undefined) setPoints(data.rewardPoints);
      }
    } catch (err) {
      console.error("Error tapping avatar:", err);
    }
  };

  // Handle completing a daily challenge
  const handleCompleteChallenge = async (challengeId: string) => {
    try {
      const res = await fetch("/api/child/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete_challenge", challengeId }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackToast(data.message);
        setAvatarExpression("proud");
        if (data.rewardPoints !== undefined) setPoints(data.rewardPoints);
        await fetchDashboardData();
        setTimeout(() => setFeedbackToast(null), 3500);
      }
    } catch (err) {
      console.error("Error completing challenge:", err);
    }
  };

  // Handle positive screen break habit
  const handleTakeNudgeBreak = async () => {
    setNudgeActionTaken(true);
    setAvatarExpression("proud");
    try {
      const res = await fetch("/api/child/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "log_break" }),
      });
      const data = await res.json();
      if (data.success) {
        setAvatarNudge(data.avatarState?.activeNudge || "Superstar move! (+25 points!)");
        if (data.rewardPoints !== undefined) setPoints(data.rewardPoints);
        setFeedbackToast("+25 Points! Great job taking a healthy screen pause! 🌟");
        setTimeout(() => setFeedbackToast(null), 3500);
      }
    } catch (err) {
      console.error("Error logging break:", err);
    }
  };

  // Handle mood selection
  const handleMoodSelect = async (m: (typeof moods)[0]) => {
    setSelectedMood(m.label);
    setSavingMood(true);
    setMoodSuccess(false);

    if (m.score >= 4) {
      setAvatarExpression("happy");
    } else if (m.score === 3) {
      setAvatarExpression(m.label === "Sleepy" ? "sleepy" : "thinking");
    } else {
      setAvatarExpression("concerned");
      setAvatarNudge(`I'm so glad you shared that with me. It's okay to feel ${m.label.toLowerCase()} sometimes. I'm right here with you! 💙`);
    }

    try {
      await fetch("/api/dashboard/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: m.emoji,
          score: m.score,
          note: `Child check-in: ${m.label}`,
        }),
      });
      setMoodSuccess(true);
      await fetchDashboardData();
      setTimeout(() => setMoodSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to save mood log:", err);
    } finally {
      setSavingMood(false);
    }
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <RoleGate allowedRole="child">
      <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm">
                AI
              </span>
              <span className="text-foreground">KiddoAI Companion</span>
            </Link>

            {/* Current Safe Zone Badge */}
            <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <MapPin size={12} />
              <span>Safe at {currentLocation.placeName}</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 shadow-xs"
            >
              <Smartphone size={13} />
              <span>{showSimulator ? "Hide Emulator" : "Device Emulator"}</span>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-3 text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm"
          >
            <Sparkles size={16} />
            <span>{feedbackToast}</span>
          </motion.div>
        )}

        {/* Device Remote Pause Alert (If Parent Paused) */}
        {todayScreenTime.devicePaused && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-foreground shadow-sm flex items-center gap-3">
            <PauseCircle size={22} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                Family Time / Device Pause Active
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                Your parent paused device apps for family dinner or quiet focus time. Great time to read, play offline, or stretch!
              </p>
            </div>
          </div>
        )}

        {/* Device Emulator Drawer for testing */}
        <AnimatePresence>
          {showSimulator && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <DeviceSimulator onEventProcessed={fetchDashboardData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stateful Animated Avatar Companion Card */}
        <Card className="mb-6 border-primary/25 bg-gradient-to-b from-primary/15 via-card to-card p-6 text-center shadow-lg relative overflow-hidden">
          <AvatarCompanion
            name="Aarav"
            expression={avatarExpression}
            nudge={avatarNudge}
            streakDays={streakDays}
            points={points}
            onTap={handleTapAvatar}
          />

          <p className="text-[11px] text-muted mt-2">
            💡 Tap Kiddo to hear a fun pro tip or joke! (+5 pts)
          </p>

          {/* Quick Positive Habit Action Button */}
          {!nudgeActionTaken && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleTakeNudgeBreak}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-sky-500 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:shadow-lg"
            >
              <Check size={15} />
              <span>I&apos;ll take a 5-minute screen pause! (+25 pts)</span>
            </motion.button>
          )}
        </Card>

        {/* Today's Screen Time & Curfew Gauge */}
        <Card className="mb-6 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h3 className="font-heading text-sm font-bold text-foreground">
                Today&apos;s Screen Time Balance
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Moon size={11} />
                <span>Dock at {todayScreenTime.curfewTime}</span>
              </span>
              <span className="text-xs font-bold font-mono text-muted">
                {todayScreenTime.usedHours}h / {todayScreenTime.limitHours}h
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-background border border-border/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                todayScreenTime.usedHours >= todayScreenTime.limitHours ? "bg-danger" : "bg-primary"
              }`}
              style={{ width: `${todayScreenTime.percentUsed}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted">
            <span>
              {todayScreenTime.remainingHours > 0
                ? `${todayScreenTime.remainingHours}h remaining for study & play`
                : "Daily limit reached — great time to recharge!"}
            </span>
            <span>{todayScreenTime.percentUsed}% used</span>
          </div>
        </Card>

        {/* Gamified Wellness Streaks Strip */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center rounded-2xl border border-border bg-card/60 p-4 shadow-xs">
            <Flame size={22} className="text-warning fill-warning animate-pulse" />
            <p className="mt-1 text-sm font-bold font-heading text-foreground">{streakDays} Days</p>
            <p className="text-[11px] text-muted font-medium">Daily Streak</p>
          </div>

          <button
            onClick={() => setShowAchievementsModal(true)}
            className="flex flex-col items-center rounded-2xl border border-border bg-card/60 p-4 shadow-xs hover:border-primary/40 hover:bg-card transition cursor-pointer"
          >
            <Trophy size={22} className="text-accent" />
            <p className="mt-1 text-sm font-bold font-heading text-foreground">
              {unlockedCount} Unlocked
            </p>
            <p className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
              <span>View Badges</span>
              <ChevronRight size={11} />
            </p>
          </button>

          <div className="flex flex-col items-center rounded-2xl border border-border bg-card/60 p-4 shadow-xs">
            <Star size={22} className="text-primary fill-primary" />
            <p className="mt-1 text-sm font-bold font-heading text-foreground">{points}</p>
            <p className="text-[11px] text-muted font-medium">Reward Points</p>
          </div>
        </div>

        {/* Interactive Daily Wellness Missions / Challenges */}
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              <CardTitle className="text-sm font-bold">Today&apos;s Wellness Missions</CardTitle>
            </div>
            <span className="text-[11px] text-muted font-medium">
              {challenges.filter((c) => c.completed).length} of {challenges.length} Done
            </span>
          </div>

          <div className="space-y-2.5">
            {challenges.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between rounded-xl border p-3 transition shadow-xs ${
                  c.completed
                    ? "border-emerald-500/30 bg-emerald-500/5 text-muted"
                    : "border-border bg-card/60 hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl shrink-0">{c.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold ${
                          c.completed ? "line-through text-muted" : "text-foreground"
                        }`}
                      >
                        {c.title}
                      </span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                        +{c.points} pts
                      </span>
                    </div>
                    <p className="text-[11px] text-muted mt-0.5">{c.desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCompleteChallenge(c.id)}
                  disabled={c.completed}
                  className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition shadow-xs ${
                    c.completed
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-default"
                      : "bg-primary text-white hover:bg-primary/90 active:scale-95"
                  }`}
                >
                  {c.completed ? (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Done</span>
                    </>
                  ) : (
                    <span>Claim</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Daily Mood Check-in with Backend Persistence */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">How are you feeling right now?</CardTitle>
              {moodSuccess && (
                <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                  <CheckCircle2 size={13} />
                  <span>Saved to your wellness journal! (+15 pts)</span>
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

        {/* Achievements Drawer / Modal */}
        <AnimatePresence>
          {showAchievementsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy size={18} className="text-accent" />
                    <h3 className="font-heading text-base font-bold text-foreground">
                      Trophies &amp; Achievements ({unlockedCount}/{achievements.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAchievementsModal(false)}
                    className="rounded-lg p-1 text-muted hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition ${
                        ach.unlocked
                          ? "border-accent/40 bg-accent/5 shadow-xs"
                          : "border-border bg-card/40 opacity-70"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background border border-border text-2xl shadow-xs">
                        {ach.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-foreground">{ach.title}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              ach.unlocked
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-card text-muted border border-border"
                            }`}
                          >
                            {ach.unlocked ? "Unlocked ✅" : ach.progress || "Locked 🔒"}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{ach.desc}</p>
                        <span className="text-[10px] font-bold text-primary mt-1 block">
                          +{ach.points} points
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-3 border-t border-border flex justify-end">
                  <button
                    onClick={() => setShowAchievementsModal(false)}
                    className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </RoleGate>
  );
}
