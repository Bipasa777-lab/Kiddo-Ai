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
  appUsage: Array<{
    app: string;
    time: string;
    minutes: number;
    percentage: number;
    color: string;
    category?: string;
  }>;
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
  referral: typeof initialReferral;
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
    doctors: [...initialDoctors],
    consultations: [...initialConsultations],
    clinicianNotes: { ...initialNotes },
    systemUsers: [...initialUsers],
    referral: { ...initialReferral },
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
    appUsage: db.appUsage,
    moodJournal: db.moodJournal,
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
