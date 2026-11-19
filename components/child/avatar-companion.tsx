"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Moon, Heart, Flame, Trophy, Star, Volume2 } from "lucide-react";

export type AvatarMood = "happy" | "concerned" | "sleepy" | "proud" | "thinking";

interface AvatarCompanionProps {
  name: string;
  expression: AvatarMood;
  nudge?: string | null;
  streakDays: number;
  points: number;
  onTap?: () => void;
}

const jokes = [
  "Why did the computer catch a cold? It had a window open! 😂",
  "Why do basketball players love donuts? Because they love to dunk them! 🍩",
  "What do you call a sleeping dinosaur? A dino-snore! 💤",
  "Why did the smartphone need glasses? Because it lost all its contacts! 📱",
];

export function AvatarCompanion({
  name,
  expression = "happy",
  nudge,
  streakDays = 6,
  points = 480,
}: AvatarCompanionProps) {
  const [activeSpeech, setActiveSpeech] = useState<string | null>(nudge || null);
  const [funMessage, setFunMessage] = useState<string | null>(null);

  const handleAvatarClick = () => {
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    setFunMessage(randomJoke);
    setTimeout(() => {
      setFunMessage(null);
    }, 6000);
  };

  const getEmotionDetails = (mood: AvatarMood) => {
    switch (mood) {
      case "sleepy":
        return {
          bg: "from-indigo-900/60 to-purple-900/40 border-indigo-500/40",
          icon: Moon,
          title: "Time for Rest 🌙",
          eyeClass: "scale-y-50",
          glow: "shadow-[0_0_25px_rgba(99,102,241,0.35)]",
        };
      case "concerned":
        return {
          bg: "from-amber-900/40 to-rose-900/30 border-amber-500/40",
          icon: Heart,
          title: "I'm Here For You 💙",
          eyeClass: "scale-90",
          glow: "shadow-[0_0_25px_rgba(244,63,94,0.35)]",
        };
      case "proud":
        return {
          bg: "from-emerald-900/40 to-teal-900/30 border-emerald-500/40",
          icon: Trophy,
          title: "Awesome Work! 🌟",
          eyeClass: "scale-110",
          glow: "shadow-[0_0_25px_rgba(16,185,129,0.35)]",
        };
      case "thinking":
        return {
          bg: "from-blue-900/40 to-cyan-900/30 border-blue-500/40",
          icon: Sparkles,
          title: "Thinking Together 💭",
          eyeClass: "scale-100",
          glow: "shadow-[0_0_25px_rgba(59,130,246,0.35)]",
        };
      case "happy":
      default:
        return {
          bg: "from-primary/20 via-sky-500/10 to-transparent border-primary/30",
          icon: Sparkles,
          title: `Hi ${name}! 🌟`,
          eyeClass: "scale-100",
          glow: "shadow-[0_0_25px_rgba(56,189,248,0.3)]",
        };
    }
  };

  const emotion = getEmotionDetails(expression);
  const displayedText = funMessage || activeSpeech || nudge || `Good to see you, ${name}! What would you like to explore today?`;

  return (
    <div className="relative flex flex-col items-center">
      {/* Dynamic Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={displayedText}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          className="mb-4 relative max-w-sm rounded-2xl border border-primary/30 bg-card/90 px-4 py-3 text-center text-sm font-medium shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-center gap-1.5 text-xs text-primary font-bold mb-1">
            <emotion.icon size={13} />
            <span>{emotion.title}</span>
          </div>
          <p className="text-foreground text-xs leading-relaxed">{displayedText}</p>
          {/* Speech bubble pointer */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card/90 border-r border-b border-primary/30 rotate-45" />
        </motion.div>
      </AnimatePresence>

      {/* Interactive Avatar Character */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleAvatarClick}
        className={`cursor-pointer relative flex h-28 w-28 items-center justify-center rounded-full border-2 bg-gradient-to-b ${emotion.bg} ${emotion.glow} transition-all duration-500`}
      >
        <motion.div
          animate={{
            y: [0, -6, 0],
            rotate: [0, 1.5, -1.5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex items-center justify-center"
        >
          {/* Animated Avatar Face (SVG) */}
          <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Soft Glowing Head Base */}
            <circle cx="50" cy="50" r="42" fill="url(#avatarGradient)" stroke="currentColor" strokeWidth="2" className="text-primary/40" />
            
            {/* Eyes */}
            {expression === "sleepy" ? (
              // Sleepy curved closed eyes
              <>
                <path d="M32 48 Q39 54 46 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground" />
                <path d="M54 48 Q61 54 68 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground" />
              </>
            ) : expression === "proud" ? (
              // Starry / ecstatic eyes
              <>
                <polygon points="39,40 41,45 46,45 42,48 44,53 39,50 34,53 36,48 32,45 37,45" fill="#F59E0B" />
                <polygon points="61,40 63,45 68,45 64,48 66,53 61,50 56,53 58,48 54,45 59,45" fill="#F59E0B" />
              </>
            ) : (
              // Friendly open animated eyes
              <>
                <circle cx="38" cy="46" r="5" fill="currentColor" className="text-foreground" />
                <circle cx="39.5" cy="44.5" r="1.8" fill="white" />
                <circle cx="62" cy="46" r="5" fill="currentColor" className="text-foreground" />
                <circle cx="63.5" cy="44.5" r="1.8" fill="white" />
              </>
            )}

            {/* Blush Cheeks */}
            <circle cx="28" cy="56" r="5" fill="#F43F5E" opacity="0.3" />
            <circle cx="72" cy="56" r="5" fill="#F43F5E" opacity="0.3" />

            {/* Mouth */}
            {expression === "concerned" ? (
              <path d="M42 66 Q50 60 58 66" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground" />
            ) : expression === "sleepy" ? (
              <ellipse cx="50" cy="64" rx="4" ry="3" fill="currentColor" className="text-foreground/70" />
            ) : (
              <path d="M40 60 Q50 72 60 60" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-foreground" />
            )}

            {/* Antennas / Robot Ears with pulsing orb */}
            <circle cx="50" cy="8" r="4" fill="#38BDF8" />
            <line x1="50" y1="8" x2="50" y2="16" stroke="#38BDF8" strokeWidth="2.5" />

            <defs>
              <linearGradient id="avatarGradient" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38BDF8" stopOpacity="0.25" />
                <stop offset="1" stopColor="#818CF8" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Tap Prompt Tooltip */}
        <div className="absolute -bottom-2 rounded-full bg-primary/20 border border-primary/30 px-2 py-0.5 text-[9px] font-semibold text-primary backdrop-blur-md">
          Tap for fun! ✨
        </div>
      </motion.div>

      {/* Gamified Streaks & Points */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs">
          <Flame size={14} className="text-warning fill-warning" />
          <span className="font-semibold">{streakDays} Days</span>
          <span className="text-[10px] text-muted">Streak</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs">
          <Star size={14} className="text-primary fill-primary" />
          <span className="font-semibold">{points}</span>
          <span className="text-[10px] text-muted">Pts</span>
        </div>
      </div>
    </div>
  );
}
