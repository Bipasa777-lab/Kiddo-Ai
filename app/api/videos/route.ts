import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

interface ParentingVideo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category:
    | "Child Screen Addiction"
    | "Student Stress & Anxiety"
    | "Mental Health & Routines"
    | "Gaming & Screen Addiction"
    | "Virtual Reality & Digital Behavior"
    | "Study Focus & Learning";
  duration: string;
  stars: number;
  reviews: number;
  author: string;
  youtubeId: string;
  youtubeUrl: string;
  directWatchUrl: string;
  thumbnailUrl: string;
  embedUrl: string;
  gradient: string;
  summary: string[];
  recommended?: boolean;
  recommendationReason?: string;
}

const PARENTING_VIDEOS: ParentingVideo[] = [
  {
    id: "v1",
    title: "Can You BREAK Your Screen Addiction of your CHILD?",
    subtitle: "SCREEN ADDICTION - स्मोकिंग से भी खतरनाक | Dr. Sweta Adatia @drsweta.adatiahindi",
    description:
      "Neurologist Dr. Sweta Adatia breaks down the neuroscience behind child screen addiction, explaining how infinite scrolling dysregulates dopamine and providing practical digital fasting solutions.",
    category: "Child Screen Addiction",
    duration: "15 min",
    stars: 4.9,
    reviews: 480,
    author: "Dr. Sweta Adatia @drsweta.adatiahindi",
    youtubeId: "IJ8E2-XNPqg",
    youtubeUrl: "https://www.youtube.com/watch?v=IJ8E2-XNPqg",
    directWatchUrl: "https://www.youtube.com/watch?v=IJ8E2-XNPqg",
    thumbnailUrl: "https://img.youtube.com/vi/IJ8E2-XNPqg/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/IJ8E2-XNPqg",
    gradient: "from-blue-600 via-indigo-600 to-purple-600",
    summary: [
      "Children mirror adult device habits: parents must model healthy digital boundaries at home.",
      "Implement structured 'digital fasts' and device-free days to reset dopamine baseline receptors.",
      "Develop an internal stopping brake system to help children transition off screens without friction.",
    ],
  },
  {
    id: "v2",
    title: "How to Manage Stress as a Student",
    subtitle: "MANAGE STRESS AS A STUDENT | Med School Insiders",
    description:
      "Med School Insiders provides a structured, evidence-based roadmap for students to manage academic anxiety, prevent burnout, and build long-term stress resilience.",
    category: "Student Stress & Anxiety",
    duration: "12 min",
    stars: 4.8,
    reviews: 320,
    author: "Med School Insiders",
    youtubeId: "p57w_7T2J2Q",
    youtubeUrl: "https://www.youtube.com/watch?v=p57w_7T2J2Q",
    directWatchUrl: "https://www.youtube.com/watch?v=p57w_7T2J2Q",
    thumbnailUrl: "https://img.youtube.com/vi/p57w_7T2J2Q/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/p57w_7T2J2Q",
    gradient: "from-amber-500 via-orange-600 to-red-600",
    summary: [
      "Distinguish between healthy eustress and chronic debilitating distress early.",
      "Prioritize non-negotiable sleep hygiene: late-night studying destroys long-term recall.",
      "Use time-blocking and deliberate physical pauses to decompress cognitive overload.",
    ],
  },
  {
    id: "v3",
    title: "How Screen Time Affects Kids' Mental Health & Brain",
    subtitle: "Screen Time & Mental Health | HealthyGamerGG",
    description:
      "Dr. Alok Kanojia (Dr. K) explains how modern interactive algorithms and gaming trigger hyper-arousal and emotional dysregulation in developing minds.",
    category: "Mental Health & Routines",
    duration: "18 min",
    stars: 4.9,
    reviews: 512,
    author: "HealthyGamerGG (Dr. K)",
    youtubeId: "V_E58t9Y914",
    youtubeUrl: "https://www.youtube.com/watch?v=V_E58t9Y914",
    directWatchUrl: "https://www.youtube.com/watch?v=V_E58t9Y914",
    thumbnailUrl: "https://img.youtube.com/vi/V_E58t9Y914/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/V_E58t9Y914",
    gradient: "from-emerald-500 via-teal-600 to-cyan-600",
    summary: [
      "Constant short-form stimuli reduce frustration tolerance and attention span.",
      "Children turn to digital escapism when feeling disconnected offline.",
      "A healthy digital routine replaces punitive bans with shared outdoor engagement.",
    ],
  },
  {
    id: "v4",
    title: "Video Game Addiction in Children — Spotting the Signs",
    subtitle: "Understanding Gaming Habits | Child Mind Institute",
    description:
      "Clinical experts guide parents on distinguishing passionate gaming from clinical addiction, setting collaborative limits, and preventing meltdown arguments.",
    category: "Gaming & Screen Addiction",
    duration: "14 min",
    stars: 4.7,
    reviews: 290,
    author: "Child Mind Institute",
    youtubeId: "E0T6J-Q4Xp8",
    youtubeUrl: "https://www.youtube.com/watch?v=E0T6J-Q4Xp8",
    directWatchUrl: "https://www.youtube.com/watch?v=E0T6J-Q4Xp8",
    thumbnailUrl: "https://img.youtube.com/vi/E0T6J-Q4Xp8/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/E0T6J-Q4Xp8",
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
    summary: [
      "Gaming provides three psychological needs: autonomy, competence, and community.",
      "Give 10-minute warning buffers before transition instead of abruptly pulling power cords.",
      "Focus conversations on values, sports, and hobbies rather than criticizing the game.",
    ],
  },
  {
    id: "v5",
    title: "Virtual Reality & Emerging Metaverse Risks for Teens",
    subtitle: "Immersive Tech & Child Development | Stanford Media Lab",
    description:
      "Insights into how spatial computing, social VR worlds, and avatar interactions impact self-perception, peer comparison, and physical safety in young adolescents.",
    category: "Virtual Reality & Digital Behavior",
    duration: "16 min",
    stars: 4.8,
    reviews: 175,
    author: "Stanford Cyber-Behavior Lab",
    youtubeId: "7Pq-S557XQU",
    youtubeUrl: "https://www.youtube.com/watch?v=7Pq-S557XQU",
    directWatchUrl: "https://www.youtube.com/watch?v=7Pq-S557XQU",
    thumbnailUrl: "https://img.youtube.com/vi/7Pq-S557XQU/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/7Pq-S557XQU",
    gradient: "from-indigo-600 via-blue-600 to-cyan-500",
    summary: [
      "Spatial VR immersion creates sensory memories that feel intensely real to developing brains.",
      "Set boundary boundaries physically in the home to prevent collisions and eye strain.",
      "Verify parental controls and privacy settings on voice-chat multiplayer lobbies.",
    ],
  },
  {
    id: "v6",
    title: "How to Help Your Child Focus on Homework Without Screen Distractions",
    subtitle: "Study Focus & Concentration Skills | Dr. Ned Hallowell",
    description:
      "ADHD and concentration specialist Dr. Ned Hallowell shares practical environmental tweaks that eliminate smartphone temptation and cultivate deep study habits.",
    category: "Study Focus & Learning",
    duration: "11 min",
    stars: 4.9,
    reviews: 410,
    author: "Dr. Ned Hallowell (Distraction Podcast)",
    youtubeId: "3qHkWkM7j0M",
    youtubeUrl: "https://www.youtube.com/watch?v=3qHkWkM7j0M",
    directWatchUrl: "https://www.youtube.com/watch?v=3qHkWkM7j0M",
    thumbnailUrl: "https://img.youtube.com/vi/3qHkWkM7j0M/hqdefault.jpg",
    embedUrl: "https://www.youtube-nocookie.com/embed/3qHkWkM7j0M",
    gradient: "from-teal-600 via-emerald-600 to-green-600",
    summary: [
      "Address physical fatigue and sleep debt before expecting high cognitive focus during homework.",
      "Break study sessions into 20-25 minute focused blocks followed by short active physical breaks.",
      "Remove smartphone notifications and extraneous digital screens from the child's study environment.",
    ],
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const query = searchParams.get("query");

  const db = getDb();
  const child = db.child;
  const activeAlerts = db.riskAlerts.filter((a) => a.status === "active");

  // Determine which categories map to active risk alerts
  const hasLateNightAlert = activeAlerts.some((a) =>
    a.title.toLowerCase().includes("late-night") || a.title.toLowerCase().includes("sleep")
  );
  const hasGamingAlert = activeAlerts.some((a) =>
    a.title.toLowerCase().includes("gaming")
  );
  const hasDistressAlert = activeAlerts.some((a) =>
    a.title.toLowerCase().includes("distress") || a.title.toLowerCase().includes("peer")
  );

  let filtered = PARENTING_VIDEOS.map((v) => {
    let recommended = false;
    let recommendationReason = "";

    if (hasLateNightAlert && (v.category === "Child Screen Addiction" || v.category === "Mental Health & Routines")) {
      recommended = true;
      recommendationReason = `Tied to ${child.name}'s recent late-night phone logs (PMC5658795 sleep guidelines).`;
    } else if (hasGamingAlert && v.category === "Gaming & Screen Addiction") {
      recommended = true;
      recommendationReason = `Tied to ${child.name}'s 38% rise in weekend gaming sessions.`;
    } else if (hasDistressAlert && v.category === "Student Stress & Anxiety") {
      recommended = true;
      recommendationReason = `Tied to emotional distress flags detected in communication channels.`;
    }

    return {
      ...v,
      recommended,
      recommendationReason,
    };
  });

  if (category && category !== "All") {
    filtered = filtered.filter((v) => v.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.subtitle.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.author.toLowerCase().includes(q)
    );
  }

  // Prioritize recommended videos to appear first
  filtered.sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));

  const categories = [
    "All",
    "Child Screen Addiction",
    "Student Stress & Anxiety",
    "Mental Health & Routines",
    "Gaming & Screen Addiction",
    "Virtual Reality & Digital Behavior",
    "Study Focus & Learning",
  ];

  return NextResponse.json({
    success: true,
    total: filtered.length,
    categories,
    videos: filtered,
    activeAlertsCount: activeAlerts.length,
  });
}
