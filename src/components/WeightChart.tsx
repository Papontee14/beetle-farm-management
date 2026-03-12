"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { WeightLog } from "@/types";

interface WeightChartProps {
  weightLogs: WeightLog[];
}

// Custom dot — highlight the latest point
function CustomDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  dataLength?: number;
  payload?: { weight: number };
}) {
  const { cx, cy, index, dataLength } = props;
  if (cx === undefined || cy === undefined) return null;
  const isLast = index === (dataLength ?? 0) - 1;
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isLast ? 6 : 4}
      fill={isLast ? "#15803d" : "#4ade80"}
      stroke={isLast ? "#fff" : "#16a34a"}
      strokeWidth={2}
    />
  );
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { dateLabel: string; weight: number; note: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-sm min-w-[120px]">
      <p className="text-gray-500 text-xs">{d.dateLabel}</p>
      <p className="font-extrabold text-forest-700 text-base">{d.weight} g</p>
      {d.note && <p className="text-gray-400 text-xs mt-0.5 italic">{d.note}</p>}
    </div>
  );
}

export default function WeightChart({ weightLogs }: WeightChartProps) {
  if (!weightLogs || weightLogs.length < 2) return null;

  // Sort by date ascending and build chart data
  const sorted = [...weightLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const data = sorted.map((w) => ({
    dateLabel: format(new Date(w.date), "d MMM yy", { locale: th }),
    weight:    Math.round(w.weight * 10) / 10,
    note:      w.note ?? "",
  }));

  const weights   = data.map((d) => d.weight);
  const minWeight = Math.max(0, Math.floor(Math.min(...weights) - 5));
  const maxWeight = Math.ceil(Math.max(...weights) + 5);
  const gain      = weights[weights.length - 1] - weights[0];
  const gainLabel = gain >= 0 ? `+${gain.toFixed(1)}` : `${gain.toFixed(1)}`;
  const gainColor = gain >= 0 ? "text-forest-600" : "text-red-500";

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {data.length} จุด · {data[0].dateLabel} – {data[data.length - 1].dateLabel}
        </p>
        <span className={`text-sm font-bold ${gainColor}`}>
          {gainLabel} g
        </span>
      </div>

      {/* Chart */}
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minWeight, maxWeight]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}g`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Average reference line */}
            <ReferenceLine
              y={Math.round((weights.reduce((a, b) => a + b, 0) / weights.length) * 10) / 10}
              stroke="#d1fae5"
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={(props) => (
                <CustomDot
                  key={`dot-${props.index}`}
                  {...props}
                  dataLength={data.length}
                />
              )}
              activeDot={{ r: 7, fill: "#15803d", stroke: "#fff", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Min / Rate / Max pills */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        {(() => {
          // weight gain rate per month (30 days)
          const firstDate = new Date(sorted[0].date).getTime();
          const lastDate  = new Date(sorted[sorted.length - 1].date).getTime();
          const daysDiff  = Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24));
          const gainTotal = weights[weights.length - 1] - weights[0];
          const ratePerMonth = (gainTotal / daysDiff) * 30;
          const rateLabel = (ratePerMonth >= 0 ? "+" : "") + ratePerMonth.toFixed(1) + " g";
          const rateColor = ratePerMonth >= 0 ? "text-forest-600" : "text-red-500";
          return [
            { label: "ต่ำสุด",       value: `${Math.min(...weights)} g`,  color: "text-gray-500" },
            { label: "เพิ่ม/เดือน",    value: rateLabel,               color: rateColor },
            { label: "สูงสุด",       value: `${Math.max(...weights)} g`,  color: "text-emerald-600 font-bold" },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-xl py-2">
              <p className="text-gray-400">{s.label}</p>
              <p className={`font-semibold ${s.color}`}>{s.value}</p>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}
