"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { riskColor, type RiskLevel } from "@/lib/mock-data";
import { CheckCircle2, ChevronDown, HeartHandshake, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RiskAlertCard({
  id,
  title,
  detail,
  level,
  confidence,
  suggestedAction,
  researchCitation,
  timestamp,
  status = "active",
  parentFeedback,
  onResolve,
}: {
  id?: string;
  title: string;
  detail: string;
  level: RiskLevel;
  confidence: number;
  suggestedAction: string;
  researchCitation?: string;
  timestamp: string;
  status?: "active" | "resolved" | "dismissed";
  parentFeedback?: string;
  onResolve?: (alertId: string, feedback: string, outcome: "improved" | "false_positive") => void;
}) {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const color = riskColor(level);

  const actionOptions = [
    { label: "Had a calm 1-on-1 bedtime talk", outcome: "improved" as const },
    { label: "Set up 9:30 PM hallway charging agreement", outcome: "improved" as const },
    { label: "Checked in on friend/school dynamics", outcome: "improved" as const },
    { label: "Dismissed as false positive", outcome: "false_positive" as const },
  ];

  const handleAction = async (actionText: string, outcome: "improved" | "false_positive") => {
    if (!id || !onResolve) return;
    setIsResolving(true);
    await onResolve(id, actionText, outcome);
    setIsResolving(false);
    setShowActionMenu(false);
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${
      status === "resolved"
        ? "border-emerald-500/30 bg-emerald-500/5 opacity-85"
        : "border-border bg-card/60"
    }`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        <div className="flex items-center gap-2">
          {status === "resolved" && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-accent">
              <CheckCircle2 size={13} />
              <span>Resolved</span>
            </span>
          )}
          <Badge color={color}>{level}</Badge>
        </div>
      </div>

      <p className="text-sm text-muted leading-relaxed">{detail}</p>

      {researchCitation && (
        <p className="mt-2 text-[10px] text-muted/80 italic">
          Research note: {researchCitation}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>Confidence: {confidence}%</span>
        <span>{timestamp}</span>
      </div>

      <div className="mt-3 rounded-lg bg-background/60 p-3 text-xs">
        <span className="font-semibold text-foreground">Offline Parenting Guidance: </span>
        <span className="text-muted leading-relaxed">{suggestedAction}</span>
      </div>

      {status === "resolved" && parentFeedback && (
        <div className="mt-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-foreground">
          <span className="font-semibold text-accent">Action Taken: </span>
          <span>{parentFeedback}</span>
        </div>
      )}

      {status === "active" && onResolve && id && (
        <div className="mt-3 relative">
          <button
            onClick={() => setShowActionMenu(!showActionMenu)}
            disabled={isResolving}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-2 text-xs font-bold text-primary transition hover:bg-primary/20"
          >
            <HeartHandshake size={14} />
            <span>Record Offline Action Taken (Closed Loop)</span>
            <ChevronDown size={13} className={`transition-transform ${showActionMenu ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showActionMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-2 space-y-1 rounded-xl border border-border bg-card p-2 shadow-xl"
              >
                <p className="px-2 py-1 text-[10px] font-bold text-muted uppercase">Select parenting outcome:</p>
                {actionOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleAction(opt.label, opt.outcome)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-primary/10 hover:text-primary"
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-muted">
                      {opt.outcome === "improved" ? "+3 pts" : "re-calibrate"}
                    </span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
