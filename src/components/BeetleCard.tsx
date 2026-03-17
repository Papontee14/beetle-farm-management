import Link from "next/link";
import { BeetleSummary, STAGE_LABEL, STAGE_ICON, STATUS_LABEL, STATUS_STYLE } from "@/types";
import { ChevronRight, Package, Scale } from "lucide-react";

const STAGE_META: Record<string, { bg: string; text: string; border: string }> = {
  Egg:   { bg: "bg-yellow-100",  text: "text-yellow-700",  border: "border-l-yellow-400" },
  L1:    { bg: "bg-lime-100",    text: "text-lime-700",    border: "border-l-lime-400" },
  L2:    { bg: "bg-green-100",   text: "text-green-700",   border: "border-l-green-400" },
  L3:    { bg: "bg-forest-100",  text: "text-forest-700",  border: "border-l-forest-400" },
  Pupa:  { bg: "bg-amber-100",   text: "text-amber-700",   border: "border-l-amber-400" },
  Adult: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-l-emerald-500" },
};

interface BeetleCardProps {
  beetle: BeetleSummary;
}

export default function BeetleCard({ beetle }: BeetleCardProps) {
  const meta = STAGE_META[beetle.stage] ?? { bg: "bg-gray-100", text: "text-gray-600", border: "border-l-gray-300" };
  const icon = STAGE_ICON[beetle.stage] ?? "🪲";

  return (
    <Link
      href={`/beetles/${beetle._id}`}
      className={`flex items-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${meta.border} px-4 py-3 hover:shadow-md hover:border-r-forest-200 hover:border-t-forest-200 hover:border-b-forest-200 transition-all duration-150 active:scale-[0.99]`}
    >
      {/* Stage icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${meta.bg}`}>
        {icon}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-sm text-gray-900">{beetle.beetleId}</span>
          {(beetle.quantity ?? 1) > 1 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-100 text-violet-700">
              ×{beetle.quantity}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-gray-500">
          <span className="flex items-center gap-0.5">
            <Package size={10} className="shrink-0" />
            {beetle.containerCode}
          </span>
          <span className="truncate">{beetle.species}</span>
          {beetle.currentWeightGrams !== undefined && (
            <span className="flex items-center gap-0.5 shrink-0">
              <Scale size={10} />
              {beetle.currentWeightGrams} g
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
          {STAGE_LABEL[beetle.stage] ?? beetle.stage}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[beetle.status] ?? "bg-gray-100 text-gray-600"}`}>
          {STATUS_LABEL[beetle.status] ?? beetle.status}
        </span>
      </div>

      <ChevronRight size={16} className="text-gray-300 shrink-0" />
    </Link>
  );
}
