"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { moodJournal as fallbackMoodJournal } from "@/lib/mock-data";

export interface MoodDayItem {
  id?: string;
  day: string;
  mood: string;
  score: number;
  note?: string;
}

export function MoodChart({ data }: { data?: MoodDayItem[] }) {
  const chartData = data && data.length > 0 ? data : fallbackMoodJournal;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 5]} hide />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 13,
          }}
          formatter={(_value, _name, item) => [
            `${(item?.payload as MoodDayItem)?.mood ?? ""} (Score: ${(item?.payload as MoodDayItem)?.score}/5)`,
            "Observed Mood",
          ]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--secondary)"
          strokeWidth={2.5}
          dot={{ r: 5, fill: "var(--secondary)" }}
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
