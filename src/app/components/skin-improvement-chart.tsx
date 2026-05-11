"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeekChartPoint } from "@/lib/skin-diary-chart";
import { cn } from "@/lib/utils";

type Props = {
  data: WeekChartPoint[];
  className?: string;
};

export function SkinImprovementChart({ data, className }: Props) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 text-sm text-slate-500 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-500",
          className,
        )}
      >
        Chưa đủ dữ liệu so sánh theo tuần. Thêm ít nhất hai ảnh cách nhau vài ngày để có % cải thiện.
      </div>
    );
  }

  return (
    <div className={cn("h-[260px] w-full rounded-2xl border border-slate-200 bg-white p-3 pt-4 dark:border-zinc-800 dark:bg-[#141820]/90", className)}>
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-zinc-500">
        Chỉ số cải thiện da (trung bình / tuần, %)
      </p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-zinc-700" />
          <XAxis
            dataKey="weekLabel"
            tick={{ fontSize: 11, fill: "currentColor" }}
            className="text-slate-600 dark:text-zinc-400"
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11, fill: "currentColor" }} className="text-slate-600 dark:text-zinc-400" />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgb(226 232 240)",
              fontSize: 13,
            }}
            formatter={(value) => {
              const n = typeof value === "number" ? value : Number(value);
              return [`${Number.isFinite(n) ? n : "—"}%`, "Cải thiện"];
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Cải thiện"
            stroke="#0d9488"
            strokeWidth={2.5}
            dot={{ fill: "#14b8a6", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
