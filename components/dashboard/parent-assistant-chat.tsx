"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Trash2,
  Download,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  suggestedFollowUps?: string[];
  parentActionTip?: string;
}

interface ParentAssistantChatProps {
  initialPrompt?: string;
  onScoreUpdate?: (score: number) => void;
}

// Simple markdown renderer for clean styling of bold, headings, bullets, blockquotes
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((line, i) => {
        // Heading 3
        if (line.startsWith("### ")) {
          return (
            <h4 key={i} className="font-heading text-base font-bold text-foreground mt-2 mb-1">
              {line.replace("### ", "")}
            </h4>
          );
        }
        // Blockquote / Script quote
        if (line.startsWith("> ")) {
          return (
            <blockquote
              key={i}
              className="border-l-4 border-primary/60 bg-primary/5 px-3 py-2 rounded-r-lg italic text-foreground my-1.5"
            >
              {line.replace("> ", "")}
            </blockquote>
          );
        }
        // Bullet list item
        if (line.startsWith("- ") || line.startsWith("* ")) {
          const itemText = line.substring(2);
          return (
            <div key={i} className="flex items-start gap-2 ml-1 text-muted">
              <span className="text-primary mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span>
                <ParseInlineFormatting text={itemText} />
              </span>
            </div>
          );
        }
        // Numbered list item (e.g. "1. ")
        if (/^\d+\.\s/.test(line)) {
          const numberMatch = line.match(/^(\d+\.)\s(.*)/);
          if (numberMatch) {
            return (
              <div key={i} className="flex items-start gap-2 ml-1 text-muted">
                <span className="font-semibold text-primary shrink-0">{numberMatch[1]}</span>
                <span>
                  <ParseInlineFormatting text={numberMatch[2]} />
                </span>
              </div>
            );
          }
        }
        // Blank line spacer
        if (!line.trim()) {
          return <div key={i} className="h-1.5" />;
        }
        // Standard paragraph
        return (
          <p key={i} className="text-foreground">
            <ParseInlineFormatting text={line} />
          </p>
        );
      })}
    </div>
  );
}

// Helper to parse **bold** and `code` inline
function ParseInlineFormatting({ text }: { text: string }) {
  // Split on bold syntax: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      })}
    </>
  );
}

export function ParentAssistantChat({ initialPrompt, onScoreUpdate }: ParentAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history from backend on mount
  const fetchChatHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/assistant");
      const data = await res.json();
      if (data.history && data.history.length > 0) {
        setMessages(
          data.history.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp
              ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : undefined,
          }))
        );
      } else {
        // Default warm greeting if brand new
        setMessages([
          {
            role: "assistant",
            content: `### 👋 Welcome to your AI Parent Assistant

I'm your 24/7 evidence-based parenting advisor, connected directly to **Aarav's real-time digital habits**.

Here is what I can help you with:
- **Conversation Scripts**: Word-for-word scripts to talk about bedtime phone habits, weekend gaming limits, or peer distress.
- **Screen Time Insights**: Explaining why screen time surged and which apps drove the increase.
- **Sleep & Melatonin Strategies**: Practical steps (like central charging docks) backed by pediatric sleep research (PMC5658795).
- **Weekly Executive Summaries**: Clear, balanced summaries of wins, watch-outs, and offline recommendations.

Choose a topic below or type any question!`,
            suggestedFollowUps: [
              "Why has screen time increased?",
              "How can I improve sleep habits?",
              "Give me an exact conversation script for tonight",
              "Generate this week's report",
            ],
          },
        ]);
      }
      if (data.wellbeingScore && onScoreUpdate) {
        onScoreUpdate(data.wellbeingScore);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, []);

  // If initialPrompt provided from parent playbook, send it
  useEffect(() => {
    if (initialPrompt && !loading) {
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Auto-scroll on new message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: timeStr,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || "I'm here to support your parenting journey. Please try asking again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedFollowUps: data.suggestedFollowUps,
        parentActionTip: data.parentActionTip,
      };

      setMessages([...nextMessages, assistantMsg]);
      if (data.wellbeingScore && onScoreUpdate) {
        onScoreUpdate(data.wellbeingScore);
      }
    } catch (err) {
      console.error("Assistant chat error:", err);
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "I'm having a temporary connectivity hiccup. Let's try your question again in just a moment!",
          timestamp: timeStr,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleClearHistory = async () => {
    try {
      await fetch("/api/assistant", { method: "DELETE" });
      setShowClearConfirm(false);
      await fetchChatHistory();
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    }
  };

  const starterChips = [
    "Why has screen time increased?",
    "How can I improve sleep habits?",
    "Give me an exact conversation script for tonight",
    "Suggest screen-free activities for this weekend",
    "Generate this week's report",
  ];

  return (
    <div className="flex h-[640px] flex-col rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
      {/* Top Chat Bar */}
      <div className="flex items-center justify-between border-b border-border bg-background/60 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <Bot size={18} />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-sm font-bold text-foreground">KiddoAI Parent Coach</h3>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                Online &amp; Active
              </span>
            </div>
            <p className="text-[11px] text-muted">Evidence-based pediatric behavioral advisor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showClearConfirm ? (
            <div className="flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-2 py-1 text-xs">
              <span className="text-danger font-medium text-[11px]">Clear all messages?</span>
              <button
                onClick={handleClearHistory}
                className="font-bold text-danger hover:underline text-[11px]"
              >
                Yes
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-muted hover:text-foreground text-[11px]"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted transition hover:border-danger/40 hover:text-danger"
              title="Reset conversation"
            >
              <Trash2 size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {historyLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-xs">Loading conversation history...</p>
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex flex-col", isUser ? "items-end" : "items-start")}
              >
                <div className="flex items-end gap-2 max-w-[92%] sm:max-w-[85%]">
                  {!isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs">
                      <Bot size={15} />
                    </div>
                  )}

                  <div
                    className={cn(
                      "group relative rounded-2xl px-4 py-3 text-sm shadow-sm",
                      isUser
                        ? "bg-primary text-white rounded-br-xs"
                        : "bg-background border border-border/80 rounded-bl-xs text-foreground"
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    ) : (
                      <FormattedMessage content={m.content} />
                    )}

                    {/* Offline Parenting Action Tip Card if present */}
                    {!isUser && m.parentActionTip && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/10 p-2.5 text-xs text-foreground">
                        <Lightbulb size={15} className="text-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-accent">Parenting Step: </span>
                          <span className="text-muted leading-relaxed">{m.parentActionTip}</span>
                        </div>
                      </div>
                    )}

                    {/* Copy message button */}
                    {!isUser && (
                      <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[10px] text-muted">
                        <span>{m.timestamp || "Just now"}</span>
                        <button
                          onClick={() => handleCopy(m.content, i)}
                          className="flex items-center gap-1 text-muted hover:text-primary transition"
                        >
                          {copiedIndex === i ? (
                            <>
                              <Check size={11} className="text-accent" />
                              <span className="text-accent font-semibold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={11} />
                              <span>Copy Script</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary text-xs">
                      <User size={14} />
                    </div>
                  )}
                </div>

                {/* Follow-up recommendation chips below assistant message */}
                {!isUser && m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && i === messages.length - 1 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-9 max-w-[90%]">
                    {m.suggestedFollowUps.map((chip, chipIdx) => (
                      <button
                        key={chipIdx}
                        onClick={() => sendMessage(chip)}
                        disabled={loading}
                        className="flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                      >
                        <span>{chip}</span>
                        <ArrowRight size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Loading / Thinking Indicator */}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Bot size={15} />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-4 py-2.5 text-xs text-muted">
              <Loader2 size={13} className="animate-spin text-primary" />
              <span>Analyzing Aarav&apos;s digital telemetry &amp; drafting guidance…</span>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Suggested Quick Starter Chips if chat is brief */}
      {messages.length <= 2 && (
        <div className="border-t border-border/50 bg-background/40 px-4 py-2.5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
            Frequently Asked by Parents:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {starterChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(chip)}
                disabled={loading}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-primary/50 hover:text-primary"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Message Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-center gap-2 border-t border-border bg-background/80 p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about screen time, bedtime scripts, gaming boundaries, or peer distress..."
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-xs sm:text-sm outline-none transition focus:border-primary/60 focus:ring-1 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md transition hover:bg-primary/90 disabled:opacity-40"
          title="Send question"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
