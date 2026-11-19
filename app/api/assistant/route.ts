import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { getDb, logChatMessage, clearChatHistory } from "@/lib/server/db";

interface LocalAssistantResponse {
  reply: string;
  suggestedFollowUps: string[];
  parentActionTip?: string;
}

function generateLocalParentAssistantReply(
  lastUserMessage: string,
  dbData: ReturnType<typeof getDb>
): LocalAssistantResponse {
  const text = lastUserMessage.toLowerCase();
  const child = dbData.child;
  const activeAlerts = dbData.riskAlerts.filter((a) => a.status === "active");
  const topApp = dbData.appUsage[0]?.app || "YouTube";
  const topAppTime = dbData.appUsage[0]?.time || "2h 15m";

  // 1. Screen Time Spike / Why has screen time increased?
  if (
    text.includes("why") &&
    (text.includes("screen") || text.includes("time") || text.includes("increased") || text.includes("high"))
  ) {
    return {
      reply: `### 📊 Screen Time Analysis for ${child.name}

Based on this week's usage telemetry, here is what changed:

1. **Weekend Concentration**: Average weekday screen time was **4.4 hours**, but surged to **7.4 hours on Saturday** and **6.0 hours on Sunday**.
2. **Top Contributing Apps**:
   - **${topApp}**: ${topAppTime} daily average (primarily passive video content).
   - **WhatsApp & Social**: ~2h 10m daily (peaking between 4:00 PM – 7:00 PM).
3. **The Bright Spot**: Educational app usage (**Google Classroom**) rose by **18%** this week!

**Pediatric Guidance**:
Rather than an abrupt, punitive device ban (which often causes pushback and secrecy), set a **time-of-day boundary** rather than a blanket hour limit. For example: unlimited educational use, but social/video streaming paused after 8:30 PM on school nights.`,
      suggestedFollowUps: [
        "Give me an exact script to set weekend streaming limits",
        "How can I improve sleep habits and late-night use?",
        "Suggest screen-free activities for this weekend",
      ],
      parentActionTip: "Negotiate a shared 90-minute entertainment window after homework and 30 mins of outdoor movement.",
    };
  }

  // 2. Sleep Habits & Late-Night Usage
  if (
    text.includes("sleep") ||
    text.includes("bedtime") ||
    text.includes("night") ||
    text.includes("curfew") ||
    text.includes("midnight")
  ) {
    return {
      reply: `### 🌙 Sleep Hygiene & Device Curfew Strategy

**Medical Evidence (PMC5658795 & PMC5839336)**:
Research shows that blue light and interactive stimuli within 60 minutes of bedtime delay melatonin release by up to **22%**, cutting REM sleep and triggering mood swings the next day.

**3-Step Action Plan for ${child.name} (Age ${child.age})**:

1. **The "Family Charging Dock"**:
   Place a multi-port charger in the kitchen or hallway. At **9:15 PM**, *all* family devices (including parents') dock for the night. Modeling this prevents feelings of unfair targeting.
2. **Get a $10 Dedicated Alarm Clock**:
   Kids often use *"my phone is my alarm"* as a justification to keep devices on their nightstand. A physical clock removes this friction.
3. **The 20-Minute Wind-Down Buffer**:
   Replace screen time with audiobooks, podcasts, reading, or a casual conversation about tomorrow's schedule.`,
      suggestedFollowUps: [
        "Give me an exact conversation script for tonight's bedtime",
        "What if my child argues they need music to sleep?",
        "Generate this week's full digital wellbeing report",
      ],
      parentActionTip: "Buy a simple bedside alarm clock so phones sleep outside the bedroom starting tonight.",
    };
  }

  // 3. Conversation Scripts ("What words should I say?")
  if (
    text.includes("script") ||
    text.includes("words to say") ||
    text.includes("how to talk") ||
    text.includes("how do i talk") ||
    text.includes("conversation starter")
  ) {
    return {
      reply: `### 🗣️ Exact Conversation Script: "The Bedtime Reset"

Use this low-pressure, collaborative framework tonight over a snack or while sitting together:

> **Parent**: *"Hey ${child.name}, you had a great week with your schoolwork! I noticed something I wanted to chat with you about: a few mornings this week you seemed pretty wiped out, and device logs showed you were up past midnight on YouTube."*
>
> *(Pause and listen without interrupting. Let them explain.)*
>
> **Parent**: *"I get it — scrolling late at night is super tempting, even for adults! But science shows screen light tricks our brains into thinking it's noon, so we wake up feeling like a zombie. I want you to have great energy for soccer and friends."*
>
> **Parent**: *"Let's test an experiment together for 4 days: at 9:30 PM, both of us plug our phones in the kitchen dock. I got you this bedside alarm clock so you won't miss morning practice. If you still feel tired on Friday, we can adjust. Deal?"*

**Pro-tip**: Side-by-side positioning (in the car, cooking together) feels far safer to adolescents than sitting across a desk.`,
      suggestedFollowUps: [
        "What if they resist giving up their phone at 9:30 PM?",
        "How do I address gaming addiction on weekends?",
        "Why has screen time increased?",
      ],
      parentActionTip: "Frame device curfews as a 4-day shared family experiment rather than a permanent punishment.",
    };
  }

  // 4. Gaming Limits & Resistance
  if (
    text.includes("game") ||
    text.includes("gaming") ||
    text.includes("minecraft") ||
    text.includes("roblox") ||
    text.includes("fortnite")
  ) {
    return {
      reply: `### 🎮 Healthy Gaming Balance for a ${child.age}-Year-Old

**Why Abrupt Shutoffs Trigger Meltdowns**:
Video games trigger continuous dopamine loops. Abruptly unplugging a console or yelling *"turn it off right now!"* causes a sharp dopamine plunge, resulting in genuine emotional distress.

**How to Manage ${child.name}'s Gaming**:

1. **The 15-Minute & 5-Minute Warning**:
   Give advance warning so they can reach a save point or finish their match.
2. **Match-Based Boundaries Instead of Timers**:
   Say: *"You can play 2 rounds of Battle Royale, or finish this Minecraft build, then it's dinner time."* Kids respect clear milestones.
3. **Earned Weekend Gaming Blocks**:
   Allow a 2-hour uninterrupted gaming session on Saturday afternoon, contingent on physical activity and homework completion in the morning.`,
      suggestedFollowUps: [
        "Give me a script for when a game session is ending",
        "Suggest screen-free activities for this weekend",
        "Generate this week's full report",
      ],
      parentActionTip: "Give a 10-minute visual warning buffer so your child can save their game without feeling ambushed.",
    };
  }

  // 5. Peer Pressure, Bullying, or Emotional Distress
  if (
    text.includes("bully") ||
    text.includes("peer") ||
    text.includes("sad") ||
    text.includes("friend") ||
    text.includes("crying") ||
    text.includes("mean") ||
    text.includes("distress")
  ) {
    return {
      reply: `### 💙 Navigating Peer Dynamics & Emotional Distress

**Pediatric Guidance (JAMA Psychiatry 2817594)**:
When digital communication flags distress (exclusion in group chats, unkind comments, FOMO), children often hide it out of fear that parents will confiscate their device.

**How to Support ${child.name}**:

1. **Reassure Device Safety**:
   Start by saying: *"Nothing you tell me will ever get your phone taken away. I'm here to back you up, not take away your connection to friends."*
2. **Validate First, Solve Second**:
   Don't jump immediately into fixing or calling school. First say: *"That sounds really hurtful. I would feel sad too if my friends did that."*
3. **Identify Real Allies**:
   Ask: *"Who in your class always makes you laugh or feels safe to hang out with?"* Help them invest in genuine offline friendships.`,
      suggestedFollowUps: [
        "What questions should I ask without seeming nosy?",
        "How do I consult a child psychologist if stress persists?",
        "Why has screen time increased?",
      ],
      parentActionTip: "Promise your child that opening up about peer problems will never result in taking their device away.",
    };
  }

  // 6. Weekend Screen-Free Activities
  if (
    text.includes("activities") ||
    text.includes("weekend") ||
    text.includes("bored") ||
    text.includes("offline")
  ) {
    return {
      reply: `### 🎯 Screen-Free High-Engagement Activities for Age ${child.age}

Kids don't want to just *"sit around without screens"*; they need stimulating dopamine alternatives:

1. **The Family MasterChef Challenge** 🍕:
   Give ${child.name} $15 at the grocery store to pick ingredients for a custom family pizza or dessert. Let them manage prep and presentation.
2. **Geocaching & Bike Trail Adventure** 🚴:
   Turn outdoor exploration into a real-world treasure hunt using GPS geocaches in local parks.
3. **Co-op Strategy Board Games** 🎲:
   Games like *Catan*, *Ticket to Ride*, or *Codenames* trigger the same strategic thinking and competition that kids love in Minecraft, but face-to-face.
4. **DIY Science or Maker Project** 🚀:
   Build a solar rover, bottle rocket, or simple wood carving kit.`,
      suggestedFollowUps: [
        "How do I handle complaints of being bored?",
        "Give me an exact script to set weekend streaming limits",
        "Generate this week's full digital report",
      ],
      parentActionTip: "Replace passive screen time with an engaging culinary or outdoor challenge where your child takes the lead.",
    };
  }

  // 7. Study Focus, Homework & Google Classroom
  if (
    text.includes("study") ||
    text.includes("homework") ||
    text.includes("focus") ||
    text.includes("classroom") ||
    text.includes("concentrat") ||
    text.includes("distract")
  ) {
    return {
      reply: `### 📚 Study Focus & Homework Environment for ${child.name}

**The Multi-Tab Problem**:
When children study on laptops or tablets, background tabs (YouTube, Discord, social media) create micro-interruptions that fracture concentration and double homework duration.

**Evidence-Based Pediatric Strategies (Dr. Ned Hallowell Research)**:

1. **The 25/5 Pomodoro Cadence**:
   Encourage ${child.name} to work in 25-minute sprints followed by a 5-minute active physical break (stretching, grabbing a snack, jumping jacks).
2. **The "Two-Browser" Rule**:
   Dedicate one clean browser profile solely to school (Google Classroom, school portal) with zero saved social logins or bookmarks.
3. **Physical Phone Placement**:
   Place smartphones in another room during study blocks. Studies show that even having a phone face-down on the desk drains cognitive working memory.`,
      suggestedFollowUps: [
        "How do I set up a distraction-free study space?",
        "Give me an exact script for tonight's bedtime",
        "Generate this week's full digital report",
      ],
      parentActionTip: "Charge smartphones in the living room during the 4:00–6:00 PM homework window.",
    };
  }

  // 8. Social Media, Instagram, TikTok & WhatsApp
  if (
    text.includes("social") ||
    text.includes("instagram") ||
    text.includes("tiktok") ||
    text.includes("whatsapp") ||
    text.includes("chat")
  ) {
    return {
      reply: `### 📱 Social Media & Communication Dynamics for Age ${child.age}

**Current Telemetry**:
${child.name} spends approximately **1h 10m on WhatsApp** and **1h 00m on Instagram** daily, with activity concentrated between **4:00 PM and 7:00 PM**.

**Pediatric Digital Safety Principles**:
1. **Communication vs. Passive Doomscrolling**:
   Messaging friends to coordinate homework or weekend sports is socially healthy; endless algorithmic video scrolling is what triggers fatigue.
2. **Group Chat Boundaries**:
   Large group chats can trigger FOMO and anxiety. Encourage ${child.name} to mute high-volume group chats during homework and bedtime.
3. **Open Door Policy**:
   Never secretly snoop through private texts unless there is an imminent safety risk. Instead, foster an open dialogue where they feel safe showing you weird or mean messages.`,
      suggestedFollowUps: [
        "Aarav had a low mood check-in. How do I gently ask if someone was mean?",
        "Why has screen time increased this week?",
        "How can I improve sleep habits and late-night use?",
      ],
      parentActionTip: "Help your child mute group chat notifications during homework and sleep hours.",
    };
  }

  // 9. Friendly Greetings
  if (text === "hi" || text === "hello" || text === "hey" || text.startsWith("hi ") || text.startsWith("hello ")) {
    return {
      reply: `### 👋 Hello! How can I support your parenting today?

I'm your **KiddoAI Parent Assistant**, connected to **${child.name}'s** live digital wellbeing data:
- **Current Wellbeing Score**: **${child.wellbeingScore} / 100** (${child.wellbeingTrend >= 0 ? "+" : ""}${child.wellbeingTrend} trend)
- **Top Active Priority**: ${activeAlerts.length > 0 ? activeAlerts[0].title : "Healthy digital balance maintained"}

Here are some helpful things we can work on right now:
1. **Bedtime Curfew Script**: Exact words to agree on an evening device dock without arguing.
2. **Weekend Gaming Limits**: Setting fair bounds for Minecraft or Roblox.
3. **Screen Time Spike Analysis**: Breaking down why screen hours rose this week.
4. **Weekly Progress Report**: Consolidated summary of wins, watch-outs, and habits.`,
      suggestedFollowUps: [
        "Give me an exact conversation script for tonight's bedtime",
        "Why has screen time increased?",
        "How can I improve sleep habits?",
        "Generate this week's full report",
      ],
      parentActionTip: "Pick one focus area today to establish a consistent, collaborative offline family routine.",
    };
  }

  // 10. Full Weekly Progress Report
  if (
    text.includes("report") ||
    text.includes("summary") ||
    text.includes("progress") ||
    text.includes("overview")
  ) {
    return {
      reply: `### 📋 Comprehensive Weekly Digital Wellbeing Report

**Student Profile**: ${child.name} (Age ${child.age}) · ${child.device}

- **Digital Wellbeing Score**: **${child.wellbeingScore} / 100** (${child.wellbeingTrend >= 0 ? "+" : ""}${child.wellbeingTrend} vs last week)
- **Weekly Screen Time Average**: **5.3 hours/day**
  - Weekdays: 4.2h (Education: 1.1h, Social: 1.4h, Gaming: 1.2h, Ent: 0.5h)
  - Weekends: 6.7h peak
- **Top Apps**:
  1. ${dbData.appUsage[0]?.app || "YouTube"} (${dbData.appUsage[0]?.time || "2h 15m"})
  2. ${dbData.appUsage[1]?.app || "WhatsApp"} (${dbData.appUsage[1]?.time || "1h 10m"})
  3. ${dbData.appUsage[2]?.app || "Instagram"} (${dbData.appUsage[2]?.time || "1h 00m"})
- **Active Risk Signals**: ${activeAlerts.length} flagged pattern(s) (${activeAlerts.map((a) => a.title).join("; ") || "None"})
- **Key Positive Wins**:
  - Educational time on Google Classroom up by **18%**.
  - 6-day daily mood check-in streak maintained.
- **Top Recommendation**: Institute a **9:30 PM kitchen charging agreement** to consolidate evening sleep quality.`,
      suggestedFollowUps: [
        "How can I improve sleep habits and late-night use?",
        "Give me an exact script for tonight's bedtime",
        "Suggest screen-free activities for this weekend",
      ],
      parentActionTip: "Review this summary together with your partner and establish one shared goal for the coming week.",
    };
  }

  // 8. General / Fallback Pediatric Guidance
  return {
    reply: `### 💡 Evidence-Based Guidance for ${child.name}

Thank you for checking in on ${child.name}'s digital wellbeing. Currently, their overall wellbeing score is **${child.wellbeingScore}/100** (${child.wellbeingTrend >= 0 ? "+" : ""}${child.wellbeingTrend} trend).

${
  activeAlerts.length > 0
    ? `**Current Priority**: The AI Risk Engine has flagged **${activeAlerts[0].title}**. Clinical research recommends addressing this through proactive family routines rather than abrupt punishment.`
    : `**Current Status**: Digital habits are balanced across educational and social apps. Continue reinforcing positive offline communication.`
}

What specific area would you like help with? I can provide **word-for-word conversation scripts**, **bedtime routine strategies**, or **balanced screen agreements**.`,
    suggestedFollowUps: [
      "Why has screen time increased?",
      "How can I improve sleep habits?",
      "Give me an exact script for tonight",
      "Generate this week's full report",
    ],
    parentActionTip: "Focus on one small habit change at a time — collaborative agreements build lifelong self-regulation.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const db = getDb();
    const child = db.child;
    const activeAlerts = db.riskAlerts.filter((a) => a.status === "active");

    const lastMessage = messages?.[messages.length - 1]?.content || "";
    if (lastMessage) {
      logChatMessage("parent_assistant", "user", lastMessage, child.id);
    }

    const systemPrompt = `You are KiddoAI Parent Assistant, an empathetic, evidence-based pediatric digital wellbeing advisor.
Context:
- Child: ${child.name}, age ${child.age}. Wellbeing score: ${child.wellbeingScore}/100 (${child.wellbeingTrend >= 0 ? "+" : ""}${child.wellbeingTrend} vs last week).
- Device: ${child.device}.
- Screen time this week: ${JSON.stringify(db.weeklyScreenTime)}.
- Top Apps: ${JSON.stringify(db.appUsage.slice(0, 4))}.
- Active risk alerts: ${activeAlerts.map((a) => `${a.title} (${a.level})`).join("; ")}.
- Research basis: Pediatric screen-sleep studies (PMC5658795, PMC4851593, JAMA Psychiatry 2817594).
Rules:
- Keep replies structured with clear markdown headings, bullet points, and practical guidance.
- Always provide actionable offline parenting strategies (conversation starters, exact words to say, family routines).
- Never diagnose medical or psychological conditions; recommend clinical specialists when appropriate.
- Be supportive, calm, and collaborative.`;

    const openai = getOpenAI();
    let reply = "";
    let suggestedFollowUps: string[] = [
      "Why has screen time increased?",
      "How can I improve sleep habits?",
      "Give me an exact conversation script for tonight",
      "Generate this week's report",
    ];
    let parentActionTip: string | undefined;

    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 450,
        });
        reply = completion.choices[0]?.message?.content ?? "";
      } catch (err) {
        console.error("OpenAI call failed, using local assistant:", err);
      }
    }

    if (!reply) {
      const localResult = generateLocalParentAssistantReply(lastMessage, db);
      reply = localResult.reply;
      suggestedFollowUps = localResult.suggestedFollowUps;
      parentActionTip = localResult.parentActionTip;
    }

    const savedMsg = logChatMessage("parent_assistant", "assistant", reply, child.id);

    return NextResponse.json({
      reply,
      suggestedFollowUps,
      parentActionTip,
      wellbeingScore: child.wellbeingScore,
      timestamp: savedMsg.timestamp,
      messageId: savedMsg.id,
    });
  } catch (error) {
    console.error("Parent assistant endpoint error:", error);
    return NextResponse.json(
      {
        reply:
          "I'm temporarily experiencing connectivity issues, but I'm here to support your parenting journey. Please try asking again.",
        suggestedFollowUps: ["Why has screen time increased?", "How can I improve sleep habits?"],
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  const db = getDb();
  const history = db.chatHistory.filter((m) => m.channel === "parent_assistant");
  return NextResponse.json({
    history,
    child: db.child,
    alerts: db.riskAlerts.filter((a) => a.status === "active"),
    topApps: db.appUsage.slice(0, 4),
    screenTime: db.weeklyScreenTime,
    wellbeingScore: db.child.wellbeingScore,
    wellbeingTrend: db.child.wellbeingTrend,
  });
}

export async function DELETE() {
  try {
    clearChatHistory("parent_assistant", "child_01");
    // Seed initial welcome message
    logChatMessage(
      "parent_assistant",
      "assistant",
      "Chat history cleared. I'm ready to help with fresh parenting insights, conversation scripts, or screen time analysis. What's on your mind?",
      "child_01"
    );
    return NextResponse.json({ success: true, message: "Chat history cleared successfully." });
  } catch (err) {
    console.error("Failed to clear chat history:", err);
    return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 });
  }
}
