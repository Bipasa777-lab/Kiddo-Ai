import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getDb, logChatMessage, updateAvatarNudge } from "@/lib/server/db";

function generateLocalCoachReply(lastUserMessage: string, childName: string): string {
  const text = lastUserMessage.toLowerCase();

  // 1. Bullying, distress, or sadness (Highest priority!)
  if (
    text.includes("mean") ||
    text.includes("bully") ||
    text.includes("laughed") ||
    text.includes("crying") ||
    text.includes("cry") ||
    text.includes("hate") ||
    text.includes("sad") ||
    text.includes("alone") ||
    text.includes("teased") ||
    text.includes("hurt")
  ) {
    return `I'm so sorry that happened, ${childName}. 💙 You don't deserve to be treated like that, and it's never your fault. Can you promise me you'll talk to mom, dad, or your teacher today? Having a trusted adult on your side makes a huge difference.`;
  }

  // 2. Sleep, bedtime, or night-time fatigue
  if (
    text.includes("sleep") ||
    text.includes("tired") ||
    text.includes("bed") ||
    text.includes("night") ||
    text.includes("insomnia") ||
    text.includes("awake")
  ) {
    return `Rest is how your body and brain recharge for tomorrow's adventures! 🌙 Let's try a quick 4-count breathing exercise: breathe in slowly... and breathe out gently. How about tucking in and letting your phone rest on the charger?`;
  }

  // 3. Homework, studying, schoolwork
  if (
    text.includes("homework") ||
    text.includes("math") ||
    text.includes("study") ||
    text.includes("exam") ||
    text.includes("test") ||
    text.includes("project") ||
    text.includes("assignment")
  ) {
    return `Homework can feel like climbing a mountain, ${childName}! 🏔️ What subject are you working on? Let's set a 15-minute timer and knock out just one small problem first.`;
  }

  // 4. Gaming or screen time
  if (
    text.includes("game") ||
    text.includes("minecraft") ||
    text.includes("roblox") ||
    text.includes("youtube") ||
    text.includes("fortnite")
  ) {
    return `Those games are super fun! 🎮 Just remember: pro players take 5-minute eye breaks so their reflexes stay lightning fast. Have you had some water and stretched recently?`;
  }

  // 5. Motivation, boredom, goals
  if (
    text.includes("motivation") ||
    text.includes("bored") ||
    text.includes("goals") ||
    text.includes("inspire") ||
    text.includes("cheer")
  ) {
    return `You're already doing great today, ${childName}! 🌟 Small steps build big superpowers. What is one awesome thing you want to accomplish in the next hour?`;
  }

  // 6. Greetings
  if (text.includes("hi") || text.includes("hello") || text.includes("hey")) {
    return `Hi ${childName}! 🌟 I'm Kiddo, your personal companion. Ready for today's adventures? How's your day going so far?`;
  }

  return `That's really interesting, ${childName}! 🌟 I'm always cheering for you. How are you feeling right now after sharing that?`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();
    const child = db.child;

    // Handle "new_chat" action
    if (body.action === "new_chat") {
      const { clearChatHistory, getChatHistory } = await import("@/lib/server/db");
      clearChatHistory("child_coach", child.id);
      const greeting = `Hi ${child.name}! 🌟 Brand new chat started! I'm right here whenever you want to talk about school, games, friends, or how your day went. What's on your mind?`;
      logChatMessage("child_coach", "assistant", greeting, child.id);
      updateAvatarNudge("Ready for a fresh conversation! 🌟", "happy");
      return NextResponse.json({
        reply: greeting,
        history: getChatHistory("child_coach", child.id),
        avatarState: db.avatarState,
      });
    }

    const { messages } = body;
    const lastMessage = messages?.[messages.length - 1]?.content || "";
    if (lastMessage) {
      logChatMessage("child_coach", "user", lastMessage, child.id);
    }

    const systemPrompt = `You are Kiddo, a warm, positive, age-appropriate AI companion for a ${child.age}-year-old child named ${child.name}.
Child wellbeing context: score is ${child.wellbeingScore}/100, active avatar mood is ${db.avatarState.moodExpression}.
Rules you must strictly follow:
- Keep replies short (2-3 sentences), warm, and encouraging.
- Never discuss adult, sexual, violent, or dangerous topics.
- If the child mentions bullying, self-harm, or danger, respond with deep empathy and gently encourage them to confide in a parent or trusted adult immediately.
- Celebrate small healthy digital habits and offer gentle nudges.`;

    const openai = getOpenAI();
    let reply = "";

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 220,
        });
        reply = completion.choices[0]?.message?.content ?? "";
      } catch (err) {
        console.error("OpenAI API call failed, falling back to local coach:", err);
      }
    }

    if (!reply) {
      reply = generateLocalCoachReply(lastMessage, child.name);
    }

    logChatMessage("child_coach", "assistant", reply, child.id);

    // Update avatar expression based on topic
    if (lastMessage.toLowerCase().includes("bully") || lastMessage.toLowerCase().includes("sad") || lastMessage.toLowerCase().includes("mean")) {
      updateAvatarNudge("Remember, you are safe and valued. Talk to a parent anytime.", "concerned");
    } else if (lastMessage.toLowerCase().includes("sleep") || lastMessage.toLowerCase().includes("night")) {
      updateAvatarNudge("Time for sweet dreams and restful sleep! 🌙", "sleepy");
    } else {
      updateAvatarNudge("Keep up the great momentum! 🌟", "happy");
    }

    return NextResponse.json({
      reply,
      avatarState: db.avatarState,
    });
  } catch (error) {
    console.error("Child coach endpoint error:", error);
    return NextResponse.json(
      { reply: "I'm always here for you! Let's take a deep breath and try again in a moment." },
      { status: 200 }
    );
  }
}

export async function GET() {
  const db = getDb();
  let history = db.chatHistory.filter((m) => m.channel === "child_coach");

  // Ensure there is always a friendly greeting so chat is never blank
  if (history.length === 0) {
    const greeting = `Hi ${db.child.name}! 🌟 I'm Kiddo, your personal AI companion. Ready for today's adventures? How's your day going so far?`;
    logChatMessage("child_coach", "assistant", greeting, db.child.id);
    history = db.chatHistory.filter((m) => m.channel === "child_coach");
  }

  return NextResponse.json({
    history,
    avatarState: db.avatarState,
  });
}

export async function DELETE() {
  try {
    const db = getDb();
    const child = db.child;
    const { clearChatHistory, getChatHistory } = await import("@/lib/server/db");
    clearChatHistory("child_coach", child.id);

    const greeting = `Hi ${child.name}! 🌟 All clean and fresh! What would you like to talk about today?`;
    logChatMessage("child_coach", "assistant", greeting, child.id);
    updateAvatarNudge("Chat history cleared. Fresh start! 🌟", "happy");

    return NextResponse.json({
      success: true,
      message: "Chat history deleted successfully.",
      history: getChatHistory("child_coach", child.id),
      avatarState: db.avatarState,
    });
  } catch (error) {
    console.error("Child coach DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat history" },
      { status: 500 }
    );
  }
}
