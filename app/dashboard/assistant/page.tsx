"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ParentAssistantChat } from "@/components/dashboard/parent-assistant-chat";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Sparkles,
  Moon,
  Gamepad2,
  Users,
  FileText,
  Clock,
  Heart,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

interface ChildContext {
  name: string;
  age: number;
  device: string;
  wellbeingScore: number;
  wellbeingTrend: number;
}

const playbooks = [
  {
    icon: Moon,
    title: "Bedtime Curfew Script",
    desc: "Word-for-word collaborative script for 9:30 PM device dock agreement.",
    prompt: "Give me an exact conversation script for tonight's bedtime",
    badge: "Sleep Risk",
    badgeColor: "var(--danger)",
  },
  {
    icon: Gamepad2,
    title: "Weekend Gaming Limits",
    desc: "Set fair Minecraft/Roblox bounds without triggering sudden meltdowns.",
    prompt: "How do I set a fair weekend gaming limit on Minecraft without an argument?",
    badge: "Gaming",
    badgeColor: "var(--warning)",
  },
  {
    icon: Heart,
    title: "Peer Drama & Bullying",
    desc: "Gentle side-by-side check-in for peer pressure or low mood check-ins.",
    prompt: "Aarav had a low mood check-in. How do I gently ask if someone was mean at school without prying?",
    badge: "Emotional",
    badgeColor: "var(--secondary)",
  },
  {
    icon: FileText,
    title: "Weekly Executive Summary",
    desc: "Consolidated breakdown of screen time, app share, and progress wins.",
    prompt: "Generate this week's full digital wellbeing report",
    badge: "Summary",
    badgeColor: "var(--accent)",
  },
  {
    icon: BookOpen,
    title: "Study Focus & Homework",
    desc: "Help child concentrate on Google Classroom without multitasking tabs.",
    prompt: "How can I help my child stay focused on Google Classroom without social media tabs?",
    badge: "Academic",
    badgeColor: "var(--primary)",
  },
  {
    icon: Clock,
    title: "Screen Time Spike Explanation",
    desc: "Understand what caused the 38% rise in weekend device hours.",
    prompt: "Why has screen time increased this week?",
    badge: "Telemetry",
    badgeColor: "var(--primary)",
  },
];

export default function AssistantPage() {
  const [childContext, setChildContext] = useState<ChildContext>({
    name: "Aarav Sharma",
    age: 12,
    device: "iPhone 13 · iOS 18",
    wellbeingScore: 74,
    wellbeingTrend: 4,
  });
  const [activePrompt, setActivePrompt] = useState<string | undefined>(undefined);
  const [subscription, setSubscription] = useState<string>("Premium");

  useEffect(() => {
    // Default to Premium for the demo so user has full access
    const savedSub = localStorage.getItem("kiddoai_subscription");
    if (savedSub) {
      setSubscription(savedSub);
    } else {
      localStorage.setItem("kiddoai_subscription", "Premium");
      setSubscription("Premium");
    }

    // Load live telemetry overview
    async function loadOverview() {
      try {
        const res = await fetch("/api/dashboard/overview");
        const json = await res.json();
        if (json.success && json.data?.child) {
          setChildContext(json.data.child);
        }
      } catch (err) {
        console.error("Failed to load child overview:", err);
      }
    }
    loadOverview();
  }, []);

  const handlePlaybookClick = (prompt: string) => {
    setActivePrompt(prompt);
    // Reset active prompt after brief tick so user can click again
    setTimeout(() => setActivePrompt(undefined), 500);
  };

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <Topbar
        title="AI Parent Assistant & Coach"
        subtitle="24/7 pediatric digital wellbeing advisor connected directly to your child's live telemetry."
      />

      {/* Child Live Telemetry Summary Banner */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-3 p-4 bg-card/60">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
            {childContext.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-muted">Child Monitored</p>
            <h4 className="truncate text-sm font-bold text-foreground">{childContext.name}</h4>
            <p className="truncate text-[10px] text-muted">{childContext.device}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 bg-card/60">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent font-bold text-lg">
            {childContext.wellbeingScore}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Wellbeing Index</p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{childContext.wellbeingScore} / 100</span>
              <span className="text-[10px] font-bold text-accent">
                ({childContext.wellbeingTrend >= 0 ? "+" : ""}{childContext.wellbeingTrend} vs last week)
              </span>
            </div>
            <p className="text-[10px] text-muted">Sleep &amp; Screen Balance</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 bg-card/60">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger/15 text-danger">
            <Moon size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">Active Risk Signal</p>
            <h4 className="text-xs font-bold text-foreground">Late-Night Phone Use</h4>
            <p className="text-[10px] text-danger font-medium">Activity past 12:15 AM</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4 bg-card/60">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted">AI Guidance Mode</p>
            <h4 className="text-xs font-bold text-foreground">Evidence-Based Pediatric</h4>
            <p className="text-[10px] text-muted">PMC5658795 &amp; PMC4851593</p>
          </div>
        </Card>
      </div>

      {/* Main Grid: Playbooks on Left, Interactive Chatbot on Right */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Quick Strategy Playbooks */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">One-Click Strategy Playbooks</CardTitle>
                <Sparkles size={14} className="text-primary" />
              </div>
              <p className="text-xs text-muted">
                Instant research-backed conversation scripts and guidance templates:
              </p>
            </CardHeader>

            <div className="space-y-2 p-4 pt-0">
              {playbooks.map((pb, idx) => {
                const Icon = pb.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePlaybookClick(pb.prompt)}
                    className="group flex w-full flex-col rounded-xl border border-border bg-card/40 p-3 text-left transition hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]"
                  >
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
                          <Icon size={14} />
                        </div>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition">
                          {pb.title}
                        </span>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                        style={{ backgroundColor: `${pb.badgeColor}20`, color: pb.badgeColor }}
                      >
                        {pb.badge}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted line-clamp-2 leading-relaxed">
                      {pb.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Offline Parenting Checklist Card */}
          <Card className="border-accent/20 bg-accent/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                <CardTitle className="text-xs font-bold text-foreground">
                  Today&apos;s High-Impact Offline Habits
                </CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-2 p-4 pt-0 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <span>Move phone charging docks to the kitchen by 9:15 PM.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <span>Have a 10-minute low-pressure chat during evening snacks.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <span>Acknowledge Aarav&apos;s +18% educational app boost!</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Full-Featured Parent Assistant Chatbot */}
        <div className="lg:col-span-8">
          <ParentAssistantChat
            initialPrompt={activePrompt}
            onScoreUpdate={(score) =>
              setChildContext((prev) => ({ ...prev, wellbeingScore: score }))
            }
          />
        </div>
      </div>
    </div>
  );
}
