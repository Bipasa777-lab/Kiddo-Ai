"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { appUsage as fallbackAppUsage } from "@/lib/mock-data";

export interface AppUsageChartItem {
  app: string;
  minutes?: number;
  percentage: number;
  color: string;
  time?: string;
}

export function AppUsageChart({ data }: { data?: AppUsageChartItem[] }) {
  const chartData = data && data.length > 0 ? data : fallbackAppUsage;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="percentage"
          nameKey="app"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
          strokeWidth={0}
          isAnimationActive={true}
        >
          {chartData.map((entry) => (
            <Cell key={entry.app} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 13,
          }}
          formatter={(value, name, item) => [
            `${value}% (${(item?.payload as AppUsageChartItem)?.time ?? ""})`,
            String(name),
          ]}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          wrapperStyle={{ fontSize: 12, color: "var(--muted)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
