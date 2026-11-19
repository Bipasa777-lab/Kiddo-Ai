import {
  getDb,
  saveDb,
  TelemetryEvent,
  RiskAlertRecord,
  InterventionRecord,
  updateAvatarNudge,
} from "./db";

// Research-backed keywords for emotional distress, cyberbullying, and negative affect
const DISTRESS_KEYWORDS = [
  "hate myself",
  "nobody likes me",
  "wanna die",
  "kill myself",
  "loser",
  "ugly",
  "fat",
  "stupid",
  "freak",
  "crying",
  "shut up",
  "leave me alone",
  "everyone hates me",
  "no friends",
  "bullied",
  "scared",
  "depressed",
  "anxious",
  "panic",
  "cant sleep",
  "can't sleep",
  "so tired",
  "nightmare",
];

export interface RiskEvaluationResult {
  isFlagged: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  confidence: number;
  triggerReason: string;
  researchCitation?: string;
  alertCreated?: RiskAlertRecord;
  interventionDispatched?: InterventionRecord;
  newWellbeingScore: number;
  wellbeingDelta: number;
  coachNudge?: string;
  parentActionAdvice?: string;
}

export function evaluateTelemetryEvent(event: TelemetryEvent): RiskEvaluationResult {
  const db = getDb();
  const rules = db.heuristicRules;

  let isFlagged = false;
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
  let confidence = 70;
  let triggerReason = "Standard digital activity logged.";
  let researchCitation = "";
  let coachNudge = "";
  let parentActionAdvice = "";

  const hour = event.hourOfDay !== undefined ? event.hourOfDay : new Date().getHours();
  const isLateNight = hour >= rules.lateNightStartHour || hour < rules.lateNightEndHour;
  const isWeekend = [0, 6].includes(new Date().getDay());

  // 1. Check for Severe / Emotional Distress & Cyberbullying Signal
  if (event.sentimentText) {
    const textLower = event.sentimentText.toLowerCase();
    const matchedDistress = DISTRESS_KEYWORDS.filter((kw) => textLower.includes(kw));

    if (matchedDistress.length > 0) {
      isFlagged = true;
      riskLevel = matchedDistress.some((kw) => ["die", "kill", "hate myself"].includes(kw))
        ? "critical"
        : "high";
      confidence = 94;
      triggerReason = `Distressing language pattern detected in digital communication (${matchedDistress.join(", ")}).`;
      researchCitation =
        "PubMed 38905775 & JAMA Psychiatry 2817594: Digital harassment & unmoderated distress exposure link directly to adolescent mental health disruptions.";
      coachNudge =
        "Hey Aarav, you are awesome and valued! 🌟 If someone was mean or something is troubling you, I'm here to listen, and talking to mom or dad can make things so much lighter.";
      parentActionAdvice =
        "Have a quiet, low-pressure 1-on-1 check-in over a snack or walk. Don't mention 'we read your texts' — instead ask: 'How have your friends been treating you lately? Anything bugging you?'";
    }
  }

  // 2. Check for Late-Night Screen Usage Pattern
  if (!isFlagged && isLateNight) {
    const duration = event.durationMinutes || 45;
    isFlagged = true;
    riskLevel = duration >= 60 ? "high" : "medium";
    confidence = Math.min(96, 82 + Math.floor(duration / 10));
    triggerReason = `Device active past curfew (${hour}:00) for ${duration} mins on ${event.appName || "device"}.`;
    researchCitation =
      "PMC5658795 & PMC5839336: Late-night blue light suppresses melatonin and is strongly associated with chronic sleep deficits and mood changes in school-aged youth.";
    coachNudge =
      "Your brain did amazing work today! 🌙 Screens past bedtime make mornings tough. How about tucking in and letting your phone rest on the charger?";
    parentActionAdvice =
      "Establish a 'devices sleep in the living room/kitchen' family norm at 9:30 PM. Offer to read a chapter of a book together or listen to soothing bedtime audio.";
  }

  // 3. Check for Excessive Gaming or Binge Sessions
  if (!isFlagged && (event.category === "gaming" || ["Minecraft", "Roblox", "Fortnite"].includes(event.appName || ""))) {
    const duration = event.durationMinutes || 0;
    if (duration >= rules.continuousGamingAlertMinutes) {
      isFlagged = true;
      riskLevel = duration >= 210 ? "high" : "medium";
      confidence = 88;
      triggerReason = `Uninterrupted gaming session of ${Math.round(duration / 60 * 10) / 10} hours detected on ${event.appName}.`;
      researchCitation =
        "PMC4851593: Heavy unsegmented gaming sessions are associated with attention fatigue and reduced physical activity.";
      coachNudge =
        "Epic gaming streak! 🎮 But high-score players know eyes and muscles need a break. Stand up, drink some water, and stretch for 10 minutes!";
      parentActionAdvice =
        "Celebrate his gaming milestones, but set a friendly visual timer for the next match: 'When this round finishes in 15 mins, let's take a bike ride or play board games.'";
    }
  }

  // 4. Check for Safe Zone Anomaly
  if (!isFlagged && event.eventType === "safe_zone" && event.locationEvent) {
    if (event.locationEvent.includes("Left School") && hour < 14) {
      isFlagged = true;
      riskLevel = "high";
      confidence = 89;
      triggerReason = `Child departed school safe zone earlier than expected (${hour}:00).`;
      researchCitation = "Physical safety and geofence monitoring telemetry.";
      coachNudge = "Hey Aarav, hope everything is okay! Did school dismiss early today?";
      parentActionAdvice = "Check in with the school office or send a gentle text to verify an early dismissal.";
    }
  }

  // Record Telemetry Event in DB
  db.telemetryEvents.push(event);
  if (db.telemetryEvents.length > 200) {
    db.telemetryEvents.shift();
  }

  // Update App Usage or Screen Time if applicable
  if (event.appName && event.durationMinutes) {
    const existingApp = db.appUsage.find((a) => a.app.toLowerCase() === event.appName!.toLowerCase());
    if (existingApp) {
      existingApp.minutes += event.durationMinutes;
      const h = Math.floor(existingApp.minutes / 60);
      const m = existingApp.minutes % 60;
      existingApp.time = `${h}h ${m < 10 ? "0" : ""}${m}m`;
    } else {
      const colors = ["#EF4444", "#22C55E", "#EC4899", "#F59E0B", "#2563EB", "#06B6D4"];
      db.appUsage.push({
        app: event.appName,
        minutes: event.durationMinutes,
        time: `${Math.floor(event.durationMinutes / 60)}h ${event.durationMinutes % 60}m`,
        percentage: 8,
        color: colors[db.appUsage.length % colors.length],
        category: event.category || "entertainment",
      });
    }

    // Recompute percentages
    const totalMinutes = db.appUsage.reduce((s, a) => s + a.minutes, 0);
    if (totalMinutes > 0) {
      db.appUsage.forEach((a) => {
        a.percentage = Math.max(1, Math.round((a.minutes / totalMinutes) * 100));
      });
    }
  }

  // Recalculate Wellbeing Score
  const oldScore = db.child.wellbeingScore;
  let activeHighAlerts = db.riskAlerts.filter((a) => a.status === "active" && (a.level === "high" || a.level === "critical")).length;
  if (isFlagged && (riskLevel === "high" || riskLevel === "critical")) {
    activeHighAlerts += 1;
  }

  // Multi-dimensional calculation
  const sleepDeduction = isLateNight ? 6 : 0;
  const alertDeduction = activeHighAlerts * 4;
  const calculatedScore = Math.max(35, Math.min(98, 85 - sleepDeduction - alertDeduction));
  const delta = calculatedScore - oldScore;

  db.child.wellbeingScore = calculatedScore;
  db.child.wellbeingTrend = delta;

  let alertRecord: RiskAlertRecord | undefined;
  let interventionRecord: InterventionRecord | undefined;

  // If flagged, create Risk Alert & Dispatched Intervention
  if (isFlagged) {
    const alertId = `r_${Date.now()}`;
    alertRecord = {
      id: alertId,
      childId: event.childId || "child_01",
      title:
        riskLevel === "critical"
          ? "Critical emotional distress pattern flagged"
          : riskLevel === "high"
          ? `High risk: ${triggerReason.split(".")[0]}`
          : `Moderate notice: ${triggerReason.split(".")[0]}`,
      detail: triggerReason,
      level: riskLevel,
      confidence,
      suggestedAction: parentActionAdvice,
      researchCitation,
      timestamp: "Just now",
      createdAt: new Date().toISOString(),
      status: "active",
    };

    db.riskAlerts.unshift(alertRecord);
    if (db.riskAlerts.length > 25) {
      db.riskAlerts.pop();
    }

    // Dispatch parallel Dual Intervention (Section 5)
    interventionRecord = {
      id: `int_${Date.now()}`,
      alertId,
      childId: event.childId || "child_01",
      timestamp: new Date().toISOString(),
      triggerEvent: triggerReason,
      coachNudge,
      childAcknowledged: false,
      parentAlertDispatched: true,
      parentActionSuggested: parentActionAdvice,
      outcome: "pending",
    };

    db.interventions.push(interventionRecord);

    // Update avatar expression and speech bubble
    if (riskLevel === "critical" || riskLevel === "high") {
      updateAvatarNudge(coachNudge, isLateNight ? "sleepy" : "concerned");
    } else {
      updateAvatarNudge(coachNudge, "thinking");
    }
  }

  // Save changes to database
  saveDb(db);

  return {
    isFlagged,
    riskLevel,
    confidence,
    triggerReason,
    researchCitation,
    alertCreated: alertRecord,
    interventionDispatched: interventionRecord,
    newWellbeingScore: calculatedScore,
    wellbeingDelta: delta,
    coachNudge,
    parentActionAdvice,
  };
}

export function generateAIParentingSummary(): { summary: string; wins: string[]; watchouts: string[] } {
  const db = getDb();
  const child = db.child;
  const activeAlerts = db.riskAlerts.filter((a) => a.status === "active");
  const highAlerts = activeAlerts.filter((a) => a.level === "high" || a.level === "critical");
  const totalScreenTime = db.weeklyScreenTime.reduce((s, d) => s + d.hours, 0);
  const avgScreenTime = (totalScreenTime / db.weeklyScreenTime.length).toFixed(1);

  const wins: string[] = [];
  const watchouts: string[] = [];

  // Wins
  if (child.wellbeingScore >= 70) {
    wins.push(`Overall digital wellbeing score remains strong at ${child.wellbeingScore}/100.`);
  }
  const topEducational = db.appUsage.find((a) => a.app.toLowerCase().includes("classroom") || a.category === "education");
  if (topEducational) {
    wins.push(`Consistent academic usage on ${topEducational.app} (${topEducational.time}).`);
  }
  const resolvedCount = db.riskAlerts.filter((a) => a.status === "resolved").length;
  if (resolvedCount > 0) {
    wins.push(`${resolvedCount} parenting conversations successfully completed this month.`);
  }
  if (wins.length === 0) {
    wins.push("Regular daily mood check-ins maintained.");
  }

  // Watchouts
  if (highAlerts.length > 0) {
    watchouts.push(`${highAlerts.length} high-priority risk patterns currently active (e.g., ${highAlerts[0].title}).`);
  }
  if (Number(avgScreenTime) > 4.5) {
    watchouts.push(`Average daily screen time (${avgScreenTime}h) exceeds the recommended 4.0h weekday baseline.`);
  }
  const lowMoods = db.moodJournal.filter((m) => m.score <= 2).length;
  if (lowMoods >= 2) {
    watchouts.push(`${lowMoods} low emotional mood check-ins logged this week.`);
  }
  if (watchouts.length === 0) {
    watchouts.push("No critical risk patterns detected. Continue positive offline routines.");
  }

  const summary = `${child.name}'s digital wellbeing score is ${child.wellbeingScore}/100 (${child.wellbeingTrend >= 0 ? "+" : ""}${child.wellbeingTrend} trend). ${
    highAlerts.length > 0
      ? `Attention needed on ${highAlerts[0].title.toLowerCase()}.`
      : "Device habits are mostly balanced."
  } Recommended focus: prioritize consistent sleep schedules and open offline check-ins.`;

  return { summary, wins, watchouts };
}
