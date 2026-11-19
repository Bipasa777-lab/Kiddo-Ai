"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  PlusCircle,
  Trash2,
  Bot,
  User,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function ChatPanel({
  endpoint,
  starterPrompts,
  placeholder,
  assistantName = "Kiddo",
  bubbleAssistantClass,
}: {
  endpoint: string;
  starterPrompts: string[];
  placeholder: string;
  assistantName?: string;
  bubbleAssistantClass?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to format ISO timestamp
  const formatTime = (isoString?: string) => {
    if (!isoString) return "Just now";
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "Just now";
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Fetch initial history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        if (data.history && Array.isArray(data.history) && data.history.length > 0) {
          setMessages(
            data.history.map((m: any) => ({
              id: m.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              role: m.role,
              content: m.content,
              timestamp: m.timestamp || new Date().toISOString(),
            }))
          );
        } else {
          // If empty, set a cheerful welcoming message
          setMessages([
            {
              id: `msg_welcome_${Date.now()}`,
              role: "assistant",
              content: `Hi! 🌟 I'm ${assistantName}, your personal companion. Ready for today's adventures? How's your day going so far?`,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        setMessages([
          {
            id: `msg_welcome_${Date.now()}`,
            role: "assistant",
            content: `Hi! 🌟 I'm ${assistantName}. What would you like to talk about today?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    }
    loadHistory();
  }, [endpoint, assistantName]);

  // Auto-scroll on new message or loading state
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message to backend
  async function send(text: string) {
    if (!text.trim() || loading || actionLoading) return;
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const next: Message[] = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const replyContent =
        data.reply || `I'm always cheering for you! 🌟 What else is on your mind?`;

      setMessages([
        ...next,
        {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: replyContent,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          id: `asst_${Date.now()}`,
          role: "assistant",
          content: "I'm having a little trouble connecting right now, but I'm still right here with you! Let's try again in a moment.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // Handle "New Chat" option
  async function handleNewChat() {
    if (actionLoading || loading) return;
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new_chat" }),
      });
      const data = await res.json();

      if (data.history && Array.isArray(data.history) && data.history.length > 0) {
        setMessages(
          data.history.map((m: any) => ({
            id: m.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date().toISOString(),
          }))
        );
      } else {
        const welcomeText =
          data.reply || `Hi! 🌟 Brand new chat started! What's on your mind today?`;
        setMessages([
          {
            id: `msg_new_${Date.now()}`,
            role: "assistant",
            content: welcomeText,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      showToast("✨ Fresh chat started!");
      setInput("");
    } catch (err) {
      console.error("New chat error:", err);
      setMessages([
        {
          id: `msg_new_${Date.now()}`,
          role: "assistant",
          content: `Hi! 🌟 Fresh chat started! Ask me anything about school, hobbies, or games!`,
          timestamp: new Date().toISOString(),
        },
      ]);
      showToast("✨ Fresh chat started!");
    } finally {
      setActionLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // Handle "Delete Chat" confirmation
  async function confirmDeleteChat() {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.history && Array.isArray(data.history) && data.history.length > 0) {
        setMessages(
          data.history.map((m: any) => ({
            id: m.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp || new Date().toISOString(),
          }))
        );
      } else {
        setMessages([
          {
            id: `msg_reset_${Date.now()}`,
            role: "assistant",
            content: `Hi! 🌟 Chat history cleared. What would you like to talk about today?`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
      setShowDeleteModal(false);
      showToast("🗑️ Chat history deleted.");
    } catch (err) {
      console.error("Delete chat error:", err);
      setMessages([
        {
          id: `msg_reset_${Date.now()}`,
          role: "assistant",
          content: `Chat history cleared. What would you like to talk about today?`,
          timestamp: new Date().toISOString(),
        },
      ]);
      setShowDeleteModal(false);
      showToast("Chat cleared.");
    } finally {
      setActionLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  return (
    <div className="flex h-[580px] flex-col rounded-2xl border border-border/80 bg-card/60 shadow-sm backdrop-blur-sm relative overflow-hidden">
      {/* Header Toolbar: Status + New Chat + Delete Chat */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Bot size={17} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">{assistantName} Coach</span>
              <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                Online
              </span>
            </div>
            <p className="text-[10px] text-muted">
              {messages.length} message{messages.length === 1 ? "" : "s"} · Safe &amp; Encouraging
            </p>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleNewChat}
            disabled={actionLoading || loading}
            title="Start a new chat session"
            className="flex items-center gap-1 rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 size={13} className="animate-spin text-primary" />
            ) : (
              <PlusCircle size={13} className="text-primary" />
            )}
            <span>New Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={actionLoading || loading}
            title="Delete conversation history"
            className="flex items-center gap-1 rounded-xl border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-4 right-4 z-20 flex items-center justify-center"
          >
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-card px-3.5 py-1 text-xs font-medium text-foreground shadow-lg backdrop-blur-md">
              <CheckCircle2 size={13} className="text-primary" />
              <span>{notification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 pr-3">
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <motion.div
              key={m.id || i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar Icon */}
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  isUser
                    ? "bg-primary text-white"
                    : "border border-primary/30 bg-primary/10 text-primary"
                )}
              >
                {isUser ? <User size={14} /> : <Bot size={14} />}
              </div>

              {/* Message Content & Meta */}
              <div className={cn("max-w-[78%] space-y-1", isUser ? "items-end text-right" : "items-start text-left")}>
                <div className="flex items-center gap-2 px-1 text-[11px] text-muted">
                  <span className="font-medium text-foreground/80">
                    {isUser ? "You" : assistantName}
                  </span>
                  <span>·</span>
                  <span>{formatTime(m.timestamp)}</span>
                </div>

                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                    isUser
                      ? "rounded-tr-sm bg-primary text-white"
                      : cn(
                          "rounded-tl-sm text-foreground",
                          bubbleAssistantClass ?? "border border-border/80 bg-background/90"
                        )
                  )}
                >
                  {m.content}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
              <Bot size={14} />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-border/70 bg-background/80 px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                <span className="ml-2 text-xs text-muted font-medium">{assistantName} is thinking…</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick Prompts Ribbon (Always available) */}
      <div className="border-t border-border/50 bg-background/40 px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-muted pl-1">
            <Sparkles size={11} className="text-amber-500" />
            Ideas:
          </span>
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => send(prompt)}
              disabled={loading || actionLoading}
              className="shrink-0 rounded-full border border-border/80 bg-card px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Message Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border/70 bg-background/80 p-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={loading || actionLoading}
          className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary/60 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || actionLoading || !input.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          title="Send message"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="font-heading text-sm font-bold text-foreground">Delete Chat History?</h4>
                  <p className="text-xs text-muted">Clear all previous messages with Kiddo</p>
                </div>
              </div>
              <p className="text-xs text-muted mb-4 leading-relaxed">
                This will permanently delete your conversation history with {assistantName}. You will start fresh with a clean slate.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                  className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteChat}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>Delete Chat</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
