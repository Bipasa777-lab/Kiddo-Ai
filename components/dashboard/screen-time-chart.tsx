"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { weeklyScreenTime as fallbackWeeklyScreenTime } from "@/lib/mock-data";

export interface ScreenTimeDay {
  day: string;
  hours: number;
  education?: number;
  social?: number;
  gaming?: number;
  entertainment?: number;
}

export function ScreenTimeChart({ data }: { data?: ScreenTimeDay[] }) {
  const chartData = data && data.length > 0 ? data : fallbackWeeklyScreenTime;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ left: -20, right: 10, top: 10 }}>
        <defs>
          <linearGradient id="screenTimeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} unit="h" />
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 13,
          }}
          formatter={(val) => [`${val} hours`, "Total Screen Time"]}
        />
        <Area
          type="monotone"
          dataKey="hours"
          stroke="var(--primary)"
          strokeWidth={2.5}
          fill="url(#screenTimeFill)"
          name="Total hours"
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
