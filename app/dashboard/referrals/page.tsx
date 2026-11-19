"use client";

import { useState, useEffect, useCallback } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Gift,
  Copy,
  Check,
  Users,
  Award,
  Send,
  Mail,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ReferralLogItem {
  id: string;
  email: string;
  date: string;
  status: "Subscribed" | "Trial Active" | "Invited";
  reward: string;
}

interface MilestoneItem {
  count: number;
  label: string;
  reached: boolean;
  current: boolean;
}

export default function ReferralHubPage() {
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState("AARAV-4F2K");
  const [totalInvited, setTotalInvited] = useState(6);
  const [premiumUnlocked, setPremiumUnlocked] = useState(true);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([
    { count: 1, label: "1 Month Free Premium", reached: true, current: false },
    { count: 3, label: "3 Months Free Premium", reached: true, current: false },
    { count: 5, label: "1 Year Family Upgrade", reached: true, current: false },
    { count: 10, label: "Lifetime VIP Access", reached: false, current: true },
  ]);
  const [logs, setLogs] = useState<ReferralLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const referralLink = `https://kiddoai.com/invite?code=${referralCode}`;

  const fetchReferralData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/referrals", { cache: "no-store" });
      const json = await res.json();
      if (json.success && json.referral) {
        setReferralCode(json.referral.code || "AARAV-4F2K");
        setTotalInvited(json.referral.invited || 0);
        setPremiumUnlocked(Boolean(json.referral.premiumUnlocked));
        if (json.referral.logs) {
          setLogs(json.referral.logs);
        }
        if (json.milestones) {
          setMilestones(json.milestones);
        }
      }
    } catch (err) {
      console.error("Failed to load referral data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) return;

    try {
      setSendingInvite(true);
      const res = await fetch("/api/dashboard/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setFeedback(json.message || "Invitation successfully sent!");
        setInviteEmail("");
        await fetchReferralData();
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback(json.error || "Failed to dispatch invitation.");
      }
    } catch (err) {
      console.error("Error sending referral invite:", err);
    } finally {
      setSendingInvite(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/dashboard/referrals?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setFeedback("Referral record removed.");
        await fetchReferralData();
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch (err) {
      console.error("Error deleting referral:", err);
    }
  };

  const handleClaimMilestone = async (count: number) => {
    try {
      const res = await fetch("/api/dashboard/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", count }),
      });
      const json = await res.json();
      setFeedback(json.message);
      await fetchReferralData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error("Error claiming milestone:", err);
    }
  };

  const subscribedCount = logs.filter((l) => l.status === "Subscribed").length;
  const progressPct = Math.min(100, Math.round((totalInvited / 10) * 100));

  return (
    <div className="space-y-6 pb-12">
      {/* Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Referral Rewards Hub &amp; Growth Perks
          </h1>
          <p className="mt-1 text-sm text-muted">
            Invite fellow parents to KiddoAI. Unlock free premium months, family licenses, and clinical credits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReferralData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition hover:bg-background shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>Sync Hub</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={15} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Referral Link & Stats Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Share Link Card */}
        <Card className="lg:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <Gift size={20} className="animate-bounce" />
              <h4 className="font-heading text-sm font-bold uppercase tracking-wider">
                Give 30 Days Free · Unlock Family Milestone
              </h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              When friends join with your code, they immediately receive a 30-day Premium trial.
              Every active referral advances your tier towards free lifetime family access.
            </p>
          </div>

          {/* Copy Bar */}
          <div className="mt-5">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1.5">
              Your Unique Referral Link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs font-mono text-foreground truncate select-all">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-primary/90"
              >
                {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Direct Email Invite Form */}
          <form onSubmit={handleSendInvite} className="mt-5 pt-4 border-t border-border/50">
            <label className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-1.5">
              Send Direct Invitation by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="parent.friend@example.com"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={sendingInvite || !inviteEmail.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-secondary px-4 py-2 text-xs font-bold text-white transition hover:bg-secondary/90 disabled:opacity-50"
              >
                {sendingInvite ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Send Invite</span>
              </button>
            </div>
          </form>
        </Card>

        {/* Right Side: Stats Panel */}
        <div className="lg:col-span-5 grid gap-4 grid-cols-2 lg:grid-cols-1">
          <Card className="p-5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                Total Parents Invited
              </span>
              <span className="text-3xl font-extrabold font-heading text-foreground mt-1 block">
                {totalInvited}
              </span>
              <span className="text-xs text-muted mt-1 block">
                {subscribedCount} subscribed, {logs.length - subscribedCount} trial active
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Users size={22} />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] text-muted font-bold uppercase tracking-wider block">
                Milestone Status
              </span>
              <span className="text-xl font-bold font-heading text-foreground mt-1 block">
                {totalInvited >= 5 ? "1 Year Family Upgrade" : "Level 2: 3 Months Premium"}
              </span>
              <span className="text-xs text-emerald-500 font-bold mt-1 block">
                {premiumUnlocked ? "Active & Unlocked" : "In Progress"}
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Award size={22} />
            </div>
          </Card>
        </div>
      </div>

      {/* Rewards Milestones Line */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
          <CardTitle>Milestone Rewards Progression ({totalInvited}/10 Referrals)</CardTitle>
          <span className="text-xs font-bold font-mono text-primary">
            {progressPct}% Completed
          </span>
        </CardHeader>

        <div className="relative mt-8 mb-8 px-4">
          <div className="h-2 w-full bg-background rounded-full border border-border" />
          <div
            className="absolute top-0 left-4 h-2 bg-emerald-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
            style={{ width: `${progressPct}%` }}
          />

          <div className="flex justify-between items-center absolute -top-3 w-full left-0 px-4">
            {milestones.map((m, idx) => (
              <div key={idx} className="flex flex-col items-center relative">
                <button
                  onClick={() => m.reached && handleClaimMilestone(m.count)}
                  className={`h-8 w-8 rounded-full border-4 flex items-center justify-center text-xs font-extrabold z-10 transition cursor-pointer ${
                    m.reached
                      ? "bg-emerald-500 border-background text-white shadow-sm hover:scale-110"
                      : m.current
                      ? "bg-card border-emerald-500 text-emerald-500 animate-pulse"
                      : "bg-card border-border text-muted"
                  }`}
                  title={m.reached ? "Click to verify claimed perk" : `${m.count} referrals required`}
                >
                  {m.count}
                </button>

                <div className="mt-3 text-center whitespace-nowrap">
                  <span
                    className={`text-[10px] font-bold block ${
                      m.reached ? "text-emerald-500" : m.current ? "text-foreground" : "text-muted"
                    }`}
                  >
                    {m.label}
                  </span>
                  <span className="text-[9px] text-muted block mt-0.5">
                    {m.reached ? "Unlocked ✅" : `${m.count - totalInvited > 0 ? `${m.count - totalInvited} more needed` : "Ready!"}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Referrals Activity log table */}
      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invited Contacts Directory</CardTitle>
            <p className="text-xs text-muted mt-0.5">
              Live referral logs synchronized with your account
            </p>
          </div>
          <span className="text-xs text-muted font-medium">{logs.length} contacts listed</span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-card/50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <th className="p-4 pl-6">Contact Email</th>
                <th className="p-4">Invite Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Reward Status</th>
                <th className="p-4 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-card/40 transition">
                  <td className="p-4 pl-6 font-bold text-foreground">{log.email}</td>
                  <td className="p-4 text-muted">{log.date}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                        log.status === "Subscribed"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : log.status === "Trial Active"
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "bg-background text-muted border border-border"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-foreground font-medium">{log.reward}</td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleDeleteInvite(log.id)}
                      className="rounded-lg p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition"
                      title="Remove record"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
