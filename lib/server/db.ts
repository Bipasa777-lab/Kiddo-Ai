import fs from "fs";
import path from "path";
import {
  child as initialChild,
  weeklyScreenTime as initialScreenTime,
  appUsage as initialAppUsage,
  moodJournal as initialMoods,
  riskAlerts as initialAlerts,
  safeZones as initialSafeZones,
  locationTimeline as initialTimeline,
  mockDoctors as initialDoctors,
  mockConsultations as initialConsultations,
  mockClinicianNotes as initialNotes,
  mockSystemUsers as initialUsers,
  referral as initialReferral,
  adminStats as initialAdminStats,
  type RiskLevel,
} from "@/lib/mock-data";

export interface TelemetryEvent {
  id: string;
  childId: string;
  timestamp: string;
  eventType: "app_session" | "chat_message" | "safe_zone" | "screen_time" | "night_activity";
  appName?: string;
  durationMinutes?: number;
  hourOfDay: number;
  category?: "education" | "social" | "gaming" | "entertainment" | "utility";
  sentimentText?: string;
  locationPlace?: string;
  locationEvent?: string;
}

export interface RiskAlertRecord {
  id: string;
  childId: string;
  title: string;
  detail: string;
  level: RiskLevel;
  confidence: number;
  suggestedAction: string;
  researchCitation?: string;
  timestamp: string;
  createdAt: string;
  status: "active" | "resolved" | "dismissed";
  resolutionOutcome?: "improved" | "neutral" | "escalated" | "false_positive";
  parentFeedback?: string;
  resolvedAt?: string;
}

export interface InterventionRecord {
  id: string;
  alertId?: string;
  childId: string;
  timestamp: string;
  triggerEvent: string;
  coachNudge: string;
  childAcknowledged: boolean;
  childResponseText?: string;
  parentAlertDispatched: boolean;
  parentActionSuggested: string;
  parentActionTaken?: string;
  outcome: "pending" | "improved" | "neutral" | "escalated";
}

export interface ChatMessageRecord {
  id: string;
  childId: string;
  channel: "child_coach" | "parent_assistant";
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AvatarStateRecord {
  childId: string;
  moodExpression: "happy" | "concerned" | "sleepy" | "proud" | "thinking";
  activeNudge: string | null;
  streakDays: number;
  achievementsCount: number;
  rewardPoints: number;
  lastInteraction: string;
}

export interface SafeZoneRecord {
  id: string;
  name: string;
  type: "home" | "school" | "tuition" | "park" | "other";
  status: "inside" | "left" | "not visited today";
  lastEvent: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  notifyOnEntry: boolean;
  notifyOnExit: boolean;
}

export interface LocationTimelineRecord {
  id?: string;
  time: string;
  timestamp?: string;
  place: string;
  event: string;
  lat: number;
  lng: number;
  batteryLevel?: number;
  isAnomaly?: boolean;
}

export interface CurrentLocationRecord {
  childId: string;
  childName: string;
  lat: number;
  lng: number;
  placeName: string;
  currentZone: string;
  status: "inside_safe_zone" | "in_transit" | "outside_safe_zone";
  lastUpdated: string;
  batteryLevel: number;
  speedKmh: number;
  accuracyMeters: number;
  isGpsActive: boolean;
}

export interface HeuristicRuleSettings {
  lateNightStartHour: number; // e.g. 22 (10 PM)
  lateNightEndHour: number; // e.g. 5 (5 AM)
  weekdayMaxScreenHours: number; // e.g. 4
  weekendMaxScreenHours: number; // e.g. 6
  continuousGamingAlertMinutes: number; // e.g. 150 (2.5h)
  confidenceThreshold: number; // e.g. 75%
  enableParallelInterventions: boolean;
}

export interface ReferralLogRecord {
  id: string;
  email: string;
  date: string;
  status: "Subscribed" | "Trial Active" | "Invited";
  reward: string;
}

export interface ReferralRecord {
  code: string;
  invited: number;
  premiumUnlocked: boolean;
  leaderboardRank: number;
  logs?: ReferralLogRecord[];
}

export interface ScreenTimeSettingsRecord {
  dailyLimitHours: number;
  bedtimeCurfew: string;
  devicePaused: boolean;
}

export interface AppUsageRecord {
  app: string;
  time: string;
  minutes: number;
  percentage: number;
  color: string;
  category?: string;
  dailyLimitMinutes?: number;
  isBlocked?: boolean;
}

export interface ChildChallengeRecord {
  id: string;
  title: string;
  desc: string;
  points: number;
  icon: string;
  completed: boolean;
  completedAt?: string;
  category: "habit" | "movement" | "learning" | "rest";
}

export interface ChildAchievementRecord {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  points: number;
  progress?: string;
}

export interface DatabaseSchema {
  child: {
    id: string;
    name: string;
    age: number;
    avatar: string;
    device: string;
    wellbeingScore: number;
    wellbeingTrend: number;
  };
  weeklyScreenTime: Array<{
    day: string;
    hours: number;
    education: number;
    social: number;
    gaming: number;
    entertainment: number;
  }>;
  screenTimeSettings?: ScreenTimeSettingsRecord;
  appUsage: AppUsageRecord[];
  childChallenges?: ChildChallengeRecord[];
  childAchievements?: ChildAchievementRecord[];
  moodJournal: Array<{
    id?: string;
    day: string;
    mood: string;
    score: number;
    note?: string;
    date?: string;
  }>;
  riskAlerts: RiskAlertRecord[];
  interventions: InterventionRecord[];
  currentLocation: CurrentLocationRecord;
  safeZones: SafeZoneRecord[];
  locationTimeline: LocationTimelineRecord[];
  telemetryEvents: TelemetryEvent[];
  chatHistory: ChatMessageRecord[];
  avatarState: AvatarStateRecord;
  doctors: typeof initialDoctors;
  consultations: typeof initialConsultations;
  clinicianNotes: typeof initialNotes;
  systemUsers: typeof initialUsers;
  referral: ReferralRecord;
  adminStats: typeof initialAdminStats;
  heuristicRules: HeuristicRuleSettings;
  modelTrainingMetrics: {
    modelAccuracy: number;
    totalEvaluations: number;
    truePositives: number;
    falsePositives: number;
    interventionsSucceeded: number;
    lastRetrainedAt: string;
  };
}

const DB_FILE_PATH = path.join(process.cwd(), ".data", "kiddoai_db.json");

const defaultDetailedSafeZones: SafeZoneRecord[] = [
  {
    id: "zone_home",
    name: "Home",
    type: "home",
    status: "inside",
    lastEvent: "Arrived 5:42 PM",
    address: "742 Evergreen Terrace, San Francisco, CA",
    lat: 37.7749,
    lng: -122.4194,
    radiusMeters: 250,
    notifyOnEntry: true,
    notifyOnExit: true,
  },
  {
    id: "zone_school",
    name: "Oakwood High School",
    type: "school",
    status: "left",
    lastEvent: "Left 3:15 PM",
    address: "450 Academic Way, San Francisco, CA",
    lat: 37.7845,
    lng: -122.4085,
    radiusMeters: 350,
    notifyOnEntry: true,
    notifyOnExit: true,
  },
  {
    id: "zone_tuition",
    name: "Science Tuition Center",
    type: "tuition",
    status: "left",
    lastEvent: "Left 5:10 PM",
    address: "120 Discovery Blvd, Suite 300, San Francisco, CA",
    lat: 37.7892,
    lng: -122.4014,
    radiusMeters: 200,
    notifyOnEntry: true,
    notifyOnExit: true,
  },
  {
    id: "zone_park",
    name: "City Central Park",
    type: "park",
    status: "not visited today",
    lastEvent: "Last visited Sunday 4:00 PM",
    address: "Central Park Recreation Grounds, San Francisco, CA",
    lat: 37.769,
    lng: -122.4467,
    radiusMeters: 400,
    notifyOnEntry: false,
    notifyOnExit: true,
  },
];

const defaultLocationTimeline: LocationTimelineRecord[] = [
  {
    id: "loc_1",
    time: "5:42 PM",
    timestamp: new Date().toISOString(),
    place: "Home",
    event: "Reached Home",
    lat: 37.7749,
    lng: -122.4194,
    batteryLevel: 84,
    isAnomaly: false,
  },
  {
    id: "loc_2",
    time: "5:10 PM",
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    place: "Science Tuition Center",
    event: "Left Safe Zone",
    lat: 37.7892,
    lng: -122.4014,
    batteryLevel: 86,
    isAnomaly: false,
  },
  {
    id: "loc_3",
    time: "3:52 PM",
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    place: "Science Tuition Center",
    event: "Entered Safe Zone",
    lat: 37.7892,
    lng: -122.4014,
    batteryLevel: 88,
    isAnomaly: false,
  },
  {
    id: "loc_4",
    time: "3:15 PM",
    timestamp: new Date(Date.now() - 147 * 60 * 1000).toISOString(),
    place: "Oakwood High School",
    event: "Left School",
    lat: 37.7845,
    lng: -122.4085,
    batteryLevel: 91,
    isAnomaly: false,
  },
  {
    id: "loc_5",
    time: "8:24 AM",
    timestamp: new Date(Date.now() - 556 * 60 * 1000).toISOString(),
    place: "Oakwood High School",
    event: "Reached School",
    lat: 37.7845,
    lng: -122.4085,
    batteryLevel: 96,
    isAnomaly: false,
  },
  {
    id: "loc_6",
    time: "8:02 AM",
    timestamp: new Date(Date.now() - 578 * 60 * 1000).toISOString(),
    place: "Home",
    event: "Left Home",
    lat: 37.7749,
    lng: -122.4194,
    batteryLevel: 100,
    isAnomaly: false,
  },
];

const defaultCurrentLocation: CurrentLocationRecord = {
  childId: "child_01",
  childName: "Aarav Sharma",
  lat: 37.7749,
  lng: -122.4194,
  placeName: "Home",
  currentZone: "Home",
  status: "inside_safe_zone",
  lastUpdated: new Date().toISOString(),
  batteryLevel: 84,
  speedKmh: 0,
  accuracyMeters: 5,
  isGpsActive: true,
};

const defaultScreenTimeSettings: ScreenTimeSettingsRecord = {
  dailyLimitHours: 4.5,
  bedtimeCurfew: "21:30",
  devicePaused: false,
};

const defaultReferralLogs: ReferralLogRecord[] = [
  { id: "ref_1", email: "priya.nair@email.com", date: "July 12, 2026", status: "Subscribed", reward: "3 Months Premium Unlocked" },
  { id: "ref_2", email: "vikram.malhotra@email.com", date: "July 18, 2026", status: "Subscribed", reward: "Milestone Tier Unlocked" },
  { id: "ref_3", email: "amit.k@email.com", date: "July 24, 2026", status: "Trial Active", reward: "Pending Subscription" },
  { id: "ref_4", email: "sara.sharma@email.com", date: "July 25, 2026", status: "Invited", reward: "Waiting for Signup" },
  { id: "ref_5", email: "raj.mehta@email.com", date: "August 2, 2026", status: "Subscribed", reward: "Family Upgrade Milestone" },
  { id: "ref_6", email: "ananya.d@email.com", date: "August 10, 2026", status: "Trial Active", reward: "Pending Verification" },
];

const defaultChildChallenges: ChildChallengeRecord[] = [
  {
    id: "ch_water",
    title: "Hydration Hero",
    desc: "Drink a glass of water and take a quick stretch break 💧",
    points: 15,
    icon: "💧",
    completed: false,
    category: "habit",
  },
  {
    id: "ch_stretch",
    title: "5-Minute Movement Break",
    desc: "Stand up, stretch your shoulders, and look at something 20 feet away 🧘",
    points: 25,
    icon: "🧘",
    completed: false,
    category: "movement",
  },
  {
    id: "ch_read",
    title: "20-Minute Bookworm",
    desc: "Read a chapter of your favorite book, comic, or article 📚",
    points: 30,
    icon: "📚",
    completed: false,
    category: "learning",
  },
  {
    id: "ch_mood",
    title: "Express Your Mood",
    desc: "Check in with Kiddo and share how your day is feeling 😊",
    points: 15,
    icon: "😊",
    completed: true,
    completedAt: new Date().toISOString(),
    category: "habit",
  },
  {
    id: "ch_curfew",
    title: "Bedtime Dock Champion",
    desc: "Place your phone on the charging dock before 9:30 PM 🌙",
    points: 50,
    icon: "🌙",
    completed: false,
    category: "rest",
  },
];

const defaultChildAchievements: ChildAchievementRecord[] = [
  {
    id: "ach_1",
    title: "New Explorer",
    desc: "Started your KiddoAI companion journey 🌟",
    icon: "🌟",
    unlocked: true,
    points: 50,
  },
  {
    id: "ach_2",
    title: "Habit Builder",
    desc: "Maintained a 3-day daily wellness check-in streak 🔥",
    icon: "🔥",
    unlocked: true,
    points: 75,
  },
  {
    id: "ach_3",
    title: "Streak Master",
    desc: "Reach a continuous 7-day wellness streak ⚡",
    icon: "⚡",
    unlocked: false,
    progress: "Day 6 of 7",
    points: 100,
  },
  {
    id: "ach_4",
    title: "Balance Champion",
    desc: "Took 10 deliberate screen break pauses 🧘",
    icon: "🧘",
    unlocked: true,
    points: 80,
  },
  {
    id: "ach_5",
    title: "Bedtime Hero",
    desc: "Docked your phone on time on 5 school nights 🌙",
    icon: "🌙",
    unlocked: true,
    points: 120,
  },
  {
    id: "ach_6",
    title: "Curious Mind",
    desc: "Had 5 positive conversations with Kiddo Coach 💡",
    icon: "💡",
    unlocked: true,
    points: 60,
  },
  {
    id: "ach_7",
    title: "500 Points Legend",
    desc: "Earn 500 total companion reward points 🏆",
    icon: "🏆",
    unlocked: false,
    progress: "480 / 500 pts",
    points: 150,
  },
];

function getDefaultInitialData(): DatabaseSchema {
  const alerts: RiskAlertRecord[] = initialAlerts.map((a) => ({
    id: a.id,
    childId: "child_01",
    title: a.title,
    detail: a.detail,
    level: a.level,
    confidence: a.confidence,
    suggestedAction: a.suggestedAction,
    researchCitation:
      a.id === "r1"
        ? "PMC5658795 & PMC5839336 (Late-night blue light and digital media shorten sleep in adolescents)"
        : a.id === "r2"
        ? "PMC4851593 (Screen time spikes correlated with attention & mood shifts)"
        : "Healthy habit baseline",
    timestamp: a.timestamp,
    createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    status: "active",
  }));

  return {
    child: { ...initialChild },
    weeklyScreenTime: [...initialScreenTime],
    screenTimeSettings: { ...defaultScreenTimeSettings },
    appUsage: [...initialAppUsage],
    moodJournal: [...initialMoods],
    riskAlerts: alerts,
    interventions: [
      {
        id: "int_01",
        alertId: "r1",
        childId: "child_01",
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        triggerEvent: "Late-night screen use detected past midnight",
        coachNudge: "Hey Aarav, getting good rest powers your brain tomorrow! Let's wind down.",
        childAcknowledged: true,
        childResponseText: "Okay Kiddo, putting phone on charging dock.",
        parentAlertDispatched: true,
        parentActionSuggested: "Discuss a healthy bedtime routine and consider a device curfew.",
        parentActionTaken: "Created a shared 9:30 PM device charging agreement in the kitchen.",
        outcome: "improved",
      },
    ],
    currentLocation: { ...defaultCurrentLocation },
    safeZones: [...defaultDetailedSafeZones],
    locationTimeline: [...defaultLocationTimeline],
    telemetryEvents: [],
    chatHistory: [
      {
        id: "msg_init_1",
        childId: "child_01",
        channel: "child_coach",
        role: "assistant",
        content: "Hi Aarav! 🌟 I'm Kiddo, your personal companion. Ready for today's adventures?",
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
      {
        id: "msg_init_2",
        childId: "child_01",
        channel: "parent_assistant",
        role: "assistant",
        content:
          "Welcome to the KiddoAI Parent Assistant. I'm here to help turn digital habits into positive offline parenting conversations. What's on your mind?",
        timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
      },
    ],
    avatarState: {
      childId: "child_01",
      moodExpression: "happy",
      activeNudge: "Remember to drink water and take a 5-minute stretch break! 💧",
      streakDays: 6,
      achievementsCount: 12,
      rewardPoints: 480,
      lastInteraction: new Date().toISOString(),
    },
    childChallenges: [...defaultChildChallenges],
    childAchievements: [...defaultChildAchievements],
    doctors: [...initialDoctors],
    consultations: [...initialConsultations],
    clinicianNotes: { ...initialNotes },
    systemUsers: [...initialUsers],
    referral: { ...initialReferral, logs: [...defaultReferralLogs] },
    adminStats: { ...initialAdminStats },
    heuristicRules: {
      lateNightStartHour: 22, // 10 PM
      lateNightEndHour: 5, // 5 AM
      weekdayMaxScreenHours: 4.5,
      weekendMaxScreenHours: 6.5,
      continuousGamingAlertMinutes: 150,
      confidenceThreshold: 75,
      enableParallelInterventions: true,
    },
    modelTrainingMetrics: {
      modelAccuracy: 91.4,
      totalEvaluations: 432,
      truePositives: 395,
      falsePositives: 37,
      interventionsSucceeded: 320,
      lastRetrainedAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    },
  };
}

// In-memory cache to ensure instant speed and atomic updates
let memoryDb: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      memoryDb = JSON.parse(raw);
      // Auto-backfill new location fields if missing or old format
      if (
        !memoryDb!.currentLocation ||
        (memoryDb!.currentLocation as any).lat === undefined ||
        typeof (memoryDb!.currentLocation as any).lat !== "number" ||
        (memoryDb!.currentLocation as any).lat < 30
      ) {
        memoryDb!.currentLocation = { ...defaultCurrentLocation };
      }
      if (!memoryDb!.safeZones || !memoryDb!.safeZones[0] || (memoryDb!.safeZones[0] as any).lat === undefined) {
        memoryDb!.safeZones = [...defaultDetailedSafeZones];
      }
      if (!memoryDb!.locationTimeline || !memoryDb!.locationTimeline[0] || (memoryDb!.locationTimeline[0] as any).lat === undefined) {
        memoryDb!.locationTimeline = [...defaultLocationTimeline];
      }
      if (!memoryDb!.screenTimeSettings) {
        memoryDb!.screenTimeSettings = { ...defaultScreenTimeSettings };
      }
      if (!memoryDb!.referral || !(memoryDb!.referral as any).logs || (memoryDb!.referral as any).logs.length === 0) {
        memoryDb!.referral = {
          code: memoryDb!.referral?.code || "AARAV-4F2K",
          invited: memoryDb!.referral?.invited ?? 6,
          premiumUnlocked: memoryDb!.referral?.premiumUnlocked ?? true,
          leaderboardRank: memoryDb!.referral?.leaderboardRank ?? 12,
          logs: [...defaultReferralLogs],
        };
      }
      if (!memoryDb!.childChallenges || memoryDb!.childChallenges.length === 0) {
        memoryDb!.childChallenges = [...defaultChildChallenges];
      }
      if (!memoryDb!.childAchievements || memoryDb!.childAchievements.length === 0) {
        memoryDb!.childAchievements = [...defaultChildAchievements];
      }
      return memoryDb!;
    }
  } catch (err) {
    console.error("Failed to read database file, reinitializing default data:", err);
  }

  memoryDb = getDefaultInitialData();
  saveDb(memoryDb);
  return memoryDb;
}

export function saveDb(data: DatabaseSchema): void {
  try {
    memoryDb = data;
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database to disk:", err);
  }
}

// Helper methods for easy querying and updates

export function getChildOverview(childId = "child_01") {
  const db = getDb();
  return {
    child: db.child,
    weeklyScreenTime: db.weeklyScreenTime,
    screenTimeSettings: db.screenTimeSettings || defaultScreenTimeSettings,
    appUsage: db.appUsage,
    moodJournal: db.moodJournal,
    referral: db.referral,
    riskAlerts: db.riskAlerts.filter((a) => a.status === "active"),
    allAlertsCount: db.riskAlerts.length,
    avatarState: db.avatarState,
    interventions: db.interventions.slice(-5),
    safeZones: db.safeZones,
    locationTimeline: db.locationTimeline,
  };
}

export function addMoodLog(mood: string, score: number, note = "") {
  const db = getDb();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const dayName = dayNames[now.getDay()];

  // Check if today already has a log, replace or append
  const existingIdx = db.moodJournal.findIndex((m) => m.day === dayName);
  const entry = {
    id: `mood_${Date.now()}`,
    day: dayName,
    mood,
    score,
    note,
    date: now.toISOString(),
  };

  if (existingIdx >= 0) {
    db.moodJournal[existingIdx] = entry;
  } else {
    db.moodJournal.push(entry);
    if (db.moodJournal.length > 7) {
      db.moodJournal.shift();
    }
  }

  // Update avatar mood and streak
  if (score >= 4) {
    db.avatarState.moodExpression = "happy";
    db.avatarState.rewardPoints += 15;
  } else if (score === 3) {
    db.avatarState.moodExpression = "proud";
  } else {
    db.avatarState.moodExpression = "concerned";
    db.avatarState.activeNudge = "I'm here for you Aarav. Want to talk about what's bugging you? 💙";
  }

  saveDb(db);
  return entry;
}

export function logChatMessage(
  channel: "child_coach" | "parent_assistant",
  role: "user" | "assistant",
  content: string,
  childId = "child_01"
) {
  const db = getDb();
  const msg: ChatMessageRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    childId,
    channel,
    role,
    content,
    timestamp: new Date().toISOString(),
  };
  db.chatHistory.push(msg);

  // Keep last 100 messages
  if (db.chatHistory.length > 100) {
    db.chatHistory = db.chatHistory.slice(-100);
  }

  saveDb(db);
  return msg;
}

export function getChatHistory(channel: "child_coach" | "parent_assistant", childId = "child_01") {
  const db = getDb();
  return db.chatHistory.filter((m) => m.channel === channel && m.childId === childId);
}

export function clearChatHistory(channel: "child_coach" | "parent_assistant", childId = "child_01") {
  const db = getDb();
  db.chatHistory = db.chatHistory.filter((m) => !(m.channel === channel && m.childId === childId));
  saveDb(db);
  return true;
}

export function updateAvatarNudge(nudge: string, expression?: AvatarStateRecord["moodExpression"]) {
  const db = getDb();
  db.avatarState.activeNudge = nudge;
  if (expression) {
    db.avatarState.moodExpression = expression;
  }
  db.avatarState.lastInteraction = new Date().toISOString();
  saveDb(db);
  return db.avatarState;
}

export function resolveAlertWithFeedback(
  alertId: string,
  parentFeedback: string,
  outcome: "improved" | "neutral" | "escalated" | "false_positive" = "improved"
) {
  const db = getDb();
  const alert = db.riskAlerts.find((a) => a.id === alertId);
  if (!alert) return null;

  alert.status = "resolved";
  alert.parentFeedback = parentFeedback;
  alert.resolutionOutcome = outcome;
  alert.resolvedAt = new Date().toISOString();

  // Update ML feedback loop metrics
  db.modelTrainingMetrics.totalEvaluations += 1;
  if (outcome === "improved" || outcome === "neutral") {
    db.modelTrainingMetrics.truePositives += 1;
    db.modelTrainingMetrics.interventionsSucceeded += 1;
  } else if (outcome === "false_positive") {
    db.modelTrainingMetrics.falsePositives += 1;
  }

  // Recalculate model accuracy percentage
  const total = db.modelTrainingMetrics.totalEvaluations;
  const truePos = db.modelTrainingMetrics.truePositives;
  db.modelTrainingMetrics.modelAccuracy = Number(((truePos / total) * 100).toFixed(1));
  db.adminStats.modelAccuracy = db.modelTrainingMetrics.modelAccuracy;

  // Wellbeing score boost when a real-world parenting action resolves an alert
  if (outcome === "improved" && db.child.wellbeingScore < 98) {
    db.child.wellbeingScore = Math.min(100, db.child.wellbeingScore + 3);
    db.child.wellbeingTrend += 1;
  }

  saveDb(db);
  return alert;
}

export function getCurrentLocation(): CurrentLocationRecord {
  const db = getDb();
  if (
    !db.currentLocation ||
    (db.currentLocation as any).lat === undefined ||
    (db.currentLocation as any).lat < 30
  ) {
    db.currentLocation = { ...defaultCurrentLocation };
    saveDb(db);
  }
  return db.currentLocation;
}

export function updateCurrentLocation(update: Partial<CurrentLocationRecord>) {
  const db = getDb();
  db.currentLocation = {
    ...db.currentLocation,
    ...update,
    lastUpdated: new Date().toISOString(),
  };

  // If status is inside a safe zone, update safe zones
  if (update.currentZone) {
    db.safeZones.forEach((z) => {
      if (z.name.toLowerCase() === update.currentZone?.toLowerCase()) {
        z.status = "inside";
        z.lastEvent = `Arrived ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      } else if (z.status === "inside") {
        z.status = "left";
        z.lastEvent = `Left ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      }
    });
  }

  saveDb(db);
  return db.currentLocation;
}

export function getSafeZones(): SafeZoneRecord[] {
  const db = getDb();
  return db.safeZones || defaultDetailedSafeZones;
}

export function upsertSafeZone(zoneData: Partial<SafeZoneRecord> & { name: string }) {
  const db = getDb();
  if (!db.safeZones) {
    db.safeZones = [...defaultDetailedSafeZones];
  }

  const existingIdx = db.safeZones.findIndex(
    (z) => z.id === zoneData.id || z.name.toLowerCase() === zoneData.name.toLowerCase()
  );

  const newZone: SafeZoneRecord = {
    id: zoneData.id || `zone_${Date.now()}`,
    name: zoneData.name,
    type: zoneData.type || "other",
    status: zoneData.status || "not visited today",
    lastEvent: zoneData.lastEvent || `Created ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    address: zoneData.address || "Configured safe zone location",
    lat: zoneData.lat !== undefined ? zoneData.lat : 37.7749,
    lng: zoneData.lng !== undefined ? zoneData.lng : -122.4194,
    radiusMeters: zoneData.radiusMeters || 300,
    notifyOnEntry: zoneData.notifyOnEntry !== undefined ? zoneData.notifyOnEntry : true,
    notifyOnExit: zoneData.notifyOnExit !== undefined ? zoneData.notifyOnExit : true,
  };

  if (existingIdx >= 0) {
    db.safeZones[existingIdx] = { ...db.safeZones[existingIdx], ...newZone };
  } else {
    db.safeZones.push(newZone);
  }

  saveDb(db);
  return newZone;
}

export function deleteSafeZone(zoneId: string) {
  const db = getDb();
  if (!db.safeZones) return false;
  const initialLen = db.safeZones.length;
  db.safeZones = db.safeZones.filter((z) => z.id !== zoneId);
  saveDb(db);
  return db.safeZones.length < initialLen;
}

export function addLocationTimelineEntry(entry: LocationTimelineRecord) {
  const db = getDb();
  if (!db.locationTimeline) {
    db.locationTimeline = [...defaultLocationTimeline];
  }

  const newEntry: LocationTimelineRecord = {
    id: entry.id || `loc_${Date.now()}`,
    time: entry.time || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timestamp: entry.timestamp || new Date().toISOString(),
    place: entry.place,
    event: entry.event,
    lat: entry.lat,
    lng: entry.lng,
    batteryLevel: entry.batteryLevel || db.currentLocation?.batteryLevel || 84,
    isAnomaly: entry.isAnomaly || false,
  };

  db.locationTimeline.unshift(newEntry);
  if (db.locationTimeline.length > 50) {
    db.locationTimeline.pop();
  }

  saveDb(db);
  return newEntry;
}

// ==========================================
// Screen Time Helpers
// ==========================================
export function getWeeklyScreenTime() {
  const db = getDb();
  return db.weeklyScreenTime;
}

export function getScreenTimeSettings(): ScreenTimeSettingsRecord {
  const db = getDb();
  return db.screenTimeSettings || defaultScreenTimeSettings;
}

export function updateScreenTimeSettings(update: Partial<ScreenTimeSettingsRecord>) {
  const db = getDb();
  db.screenTimeSettings = {
    ...(db.screenTimeSettings || defaultScreenTimeSettings),
    ...update,
  };
  saveDb(db);
  return db.screenTimeSettings;
}

export function logScreenTimeSession(params: {
  day?: string;
  hours: number;
  category: "education" | "social" | "gaming" | "entertainment";
  appName?: string;
}) {
  const db = getDb();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const targetDay = params.day || dayNames[new Date().getDay()];

  let dayRecord = db.weeklyScreenTime.find((d) => d.day === targetDay);
  if (!dayRecord) {
    dayRecord = {
      day: targetDay,
      hours: 0,
      education: 0,
      social: 0,
      gaming: 0,
      entertainment: 0,
    };
    db.weeklyScreenTime.push(dayRecord);
  }

  const addedHours = Number(params.hours) || 0.5;
  dayRecord[params.category] = Number((dayRecord[params.category] + addedHours).toFixed(1));
  dayRecord.hours = Number(
    (dayRecord.education + dayRecord.social + dayRecord.gaming + dayRecord.entertainment).toFixed(1)
  );

  // If app specified, also update app usage
  if (params.appName) {
    simulateAppSession(params.appName, Math.round(addedHours * 60), params.category, false);
  }

  // Adjust wellbeing score slightly: +education improves, excessive gaming trims slightly
  if (params.category === "education") {
    db.child.wellbeingScore = Math.min(100, db.child.wellbeingScore + 1);
  } else if (params.category === "gaming" && addedHours >= 2) {
    db.child.wellbeingScore = Math.max(30, db.child.wellbeingScore - 1);
  }

  saveDb(db);
  return {
    weeklyScreenTime: db.weeklyScreenTime,
    child: db.child,
    appUsage: db.appUsage,
  };
}

// ==========================================
// App Usage Helpers
// ==========================================
export function getAppUsage() {
  const db = getDb();
  return db.appUsage;
}

export function setAppDailyLimit(appName: string, dailyLimitMinutes: number, isBlocked = false) {
  const db = getDb();
  const app = db.appUsage.find((a) => a.app.toLowerCase() === appName.toLowerCase());
  if (app) {
    app.dailyLimitMinutes = dailyLimitMinutes;
    app.isBlocked = isBlocked;
    saveDb(db);
    return app;
  }
  return null;
}

export function simulateAppSession(
  appName: string,
  additionalMinutes: number,
  category: string = "entertainment",
  updateWeekly = true
) {
  const db = getDb();
  let app = db.appUsage.find((a) => a.app.toLowerCase() === appName.toLowerCase());

  if (!app) {
    const palette = ["#EF4444", "#22C55E", "#EC4899", "#F59E0B", "#2563EB", "#06B6D4", "#8B5CF6"];
    app = {
      app: appName,
      time: "0h 0m",
      minutes: 0,
      percentage: 0,
      color: palette[db.appUsage.length % palette.length],
      category,
    };
    db.appUsage.push(app);
  }

  app.minutes += additionalMinutes;
  const hours = Math.floor(app.minutes / 60);
  const mins = app.minutes % 60;
  app.time = `${hours}h ${mins}m`;
  if (category) app.category = category;

  // Recalculate percentages
  const totalMinutes = db.appUsage.reduce((acc, a) => acc + a.minutes, 0) || 1;
  db.appUsage.forEach((a) => {
    a.percentage = Math.round((a.minutes / totalMinutes) * 100);
  });

  // Sort by minutes descending
  db.appUsage.sort((a, b) => b.minutes - a.minutes);

  // If updateWeekly, also add to screen time
  if (updateWeekly) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const targetDay = dayNames[new Date().getDay()];
    const dayRecord = db.weeklyScreenTime.find((d) => d.day === targetDay);
    if (dayRecord) {
      const addedH = Number((additionalMinutes / 60).toFixed(1));
      const validCat: "education" | "social" | "gaming" | "entertainment" =
        category === "gaming" ? "gaming" : category === "social" ? "social" : category === "entertainment" ? "entertainment" : "education";
      dayRecord[validCat] = Number((dayRecord[validCat] + addedH).toFixed(1));
      dayRecord.hours = Number(
        (dayRecord.education + dayRecord.social + dayRecord.gaming + dayRecord.entertainment).toFixed(1)
      );
    }
  }

  saveDb(db);
  return {
    app,
    appUsage: db.appUsage,
    weeklyScreenTime: db.weeklyScreenTime,
  };
}

// ==========================================
// Mood Journal Helpers
// ==========================================
export function getMoodJournal() {
  const db = getDb();
  return db.moodJournal;
}

export function deleteMoodLog(id: string) {
  const db = getDb();
  const initLen = db.moodJournal.length;
  db.moodJournal = db.moodJournal.filter((m) => m.id !== id);
  saveDb(db);
  return db.moodJournal.length < initLen;
}

// ==========================================
// Referral Hub Helpers
// ==========================================
export function getReferralData() {
  const db = getDb();
  if (!db.referral.logs || db.referral.logs.length === 0) {
    db.referral.logs = [...defaultReferralLogs];
    saveDb(db);
  }
  return db.referral;
}

export function sendReferralInvite(email: string) {
  const db = getDb();
  if (!db.referral.logs) {
    db.referral.logs = [...defaultReferralLogs];
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = db.referral.logs.find((r) => r.email.toLowerCase() === cleanEmail);
  if (existing) {
    return {
      success: true,
      alreadyInvited: true,
      referral: db.referral,
      message: `${email} is already on your invited list!`,
    };
  }

  const newLog: ReferralLogRecord = {
    id: `ref_${Date.now()}`,
    email: cleanEmail,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    status: "Invited",
    reward: "Pending Trial Activation",
  };

  db.referral.logs.unshift(newLog);
  db.referral.invited += 1;
  if (db.referral.invited >= 5) {
    db.referral.premiumUnlocked = true;
  }

  saveDb(db);
  return {
    success: true,
    entry: newLog,
    referral: db.referral,
    message: `Invitation successfully dispatched to ${email}!`,
  };
}

export function deleteReferralInvite(id: string) {
  const db = getDb();
  if (!db.referral.logs) return false;
  const initialLen = db.referral.logs.length;
  db.referral.logs = db.referral.logs.filter((r) => r.id !== id);
  if (db.referral.logs.length < initialLen && db.referral.invited > 0) {
    db.referral.invited = Math.max(0, db.referral.invited - 1);
  }
  saveDb(db);
  return true;
}

export function claimReferralMilestone(count: number) {
  const db = getDb();
  if (db.referral.invited >= count) {
    db.referral.premiumUnlocked = true;
    saveDb(db);
    return {
      success: true,
      message: `Milestone for ${count} referrals claimed! Premium active.`,
      referral: db.referral,
    };
  }
  return {
    success: false,
    message: `You need ${count - db.referral.invited} more referrals to unlock this tier.`,
  };
}

// ==========================================
// Child Companion & Dashboard Helpers
// ==========================================

export function getChildDashboardData(childId = "child_01") {
  const db = getDb();
  if (!db.childChallenges || db.childChallenges.length === 0) {
    db.childChallenges = [...defaultChildChallenges];
  }
  if (!db.childAchievements || db.childAchievements.length === 0) {
    db.childAchievements = [...defaultChildAchievements];
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayDay = dayNames[new Date().getDay()];
  const todayScreen = db.weeklyScreenTime.find((d) => d.day === todayDay) || db.weeklyScreenTime[0];
  const screenSettings = db.screenTimeSettings || defaultScreenTimeSettings;

  const hoursRemaining = Math.max(0, Number((screenSettings.dailyLimitHours - todayScreen.hours).toFixed(1)));
  const percentScreenUsed = Math.min(100, Math.round((todayScreen.hours / screenSettings.dailyLimitHours) * 100));

  return {
    child: db.child,
    avatarState: db.avatarState,
    challenges: db.childChallenges,
    achievements: db.childAchievements,
    todayScreenTime: {
      usedHours: todayScreen.hours,
      limitHours: screenSettings.dailyLimitHours,
      remainingHours: hoursRemaining,
      percentUsed: percentScreenUsed,
      curfewTime: screenSettings.bedtimeCurfew,
      devicePaused: Boolean(screenSettings.devicePaused),
    },
    currentLocation: {
      placeName: db.currentLocation?.placeName || "Home",
      status: db.currentLocation?.status || "inside_safe_zone",
    },
    recentChat: db.chatHistory.filter((m) => m.channel === "child_coach").slice(-4),
  };
}

export function completeChildChallenge(challengeId: string) {
  const db = getDb();
  if (!db.childChallenges) {
    db.childChallenges = [...defaultChildChallenges];
  }
  if (!db.childAchievements) {
    db.childAchievements = [...defaultChildAchievements];
  }

  const challenge = db.childChallenges.find((c) => c.id === challengeId);
  if (!challenge) {
    return { success: false, message: "Challenge not found" };
  }

  if (challenge.completed) {
    return {
      success: true,
      alreadyCompleted: true,
      message: `You already completed ${challenge.title} today!`,
      avatarState: db.avatarState,
      challenges: db.childChallenges,
    };
  }

  // Mark challenge completed
  challenge.completed = true;
  challenge.completedAt = new Date().toISOString();

  // Award reward points
  db.avatarState.rewardPoints += challenge.points;
  db.avatarState.moodExpression = "proud";
  db.avatarState.activeNudge = `Outstanding work, ${db.child.name}! You finished '${challenge.title}' and claimed +${challenge.points} points! 🌟`;
  db.avatarState.lastInteraction = new Date().toISOString();

  // Check 500 point achievement
  const ach500 = db.childAchievements.find((a) => a.id === "ach_7");
  if (ach500) {
    ach500.progress = `${db.avatarState.rewardPoints} / 500 pts`;
    if (db.avatarState.rewardPoints >= 500 && !ach500.unlocked) {
      ach500.unlocked = true;
      ach500.unlockedAt = new Date().toISOString();
      db.avatarState.achievementsCount += 1;
    }
  }

  // Boost wellbeing score slightly for positive behavior
  db.child.wellbeingScore = Math.min(100, db.child.wellbeingScore + 1);

  saveDb(db);
  return {
    success: true,
    message: `+${challenge.points} Points Earned! Keep shining!`,
    challenge,
    avatarState: db.avatarState,
    challenges: db.childChallenges,
    achievements: db.childAchievements,
    rewardPoints: db.avatarState.rewardPoints,
  };
}

export function updateAvatarCompanionState(update: Partial<AvatarStateRecord>) {
  const db = getDb();
  db.avatarState = {
    ...db.avatarState,
    ...update,
    lastInteraction: new Date().toISOString(),
  };
  saveDb(db);
  return db.avatarState;
}

export function tapAvatarCompanion() {
  const db = getDb();
  const tipsAndJokes = [
    "Why did the computer catch a cold? It had too many open windows! 😂 (+5 points!)",
    "Did you know honey never spoils? Archaeologists found 3000-year-old honey that is still edible! 🍯 (+5 points!)",
    "Pro tip: Drinking water boosts your brain speed by 14%! Take a sip right now! 💧 (+5 points!)",
    "What do you call a sleeping dinosaur? A dino-snore! 💤 (+5 points!)",
    "Champions don't just game hard — they sleep well and stretch tall! 🌟 (+5 points!)",
  ];

  const randomNote = tipsAndJokes[Math.floor(Math.random() * tipsAndJokes.length)];
  db.avatarState.rewardPoints += 5;
  db.avatarState.lastInteraction = new Date().toISOString();

  saveDb(db);
  return {
    success: true,
    message: randomNote,
    avatarState: db.avatarState,
    rewardPoints: db.avatarState.rewardPoints,
  };
}
