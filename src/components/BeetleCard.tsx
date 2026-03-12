import Link from "next/link";
import { BeetleSummary } from "@/types";
import { ChevronRight } from "lucide-react";

const STAGE_COLOR: Record<string, string> = {
  Egg:   "bg-yellow-100 text-yellow-700",
  L1:    "bg-lime-100 text-lime-700",
  L2:    "bg-green-100 text-green-700",
  L3:    "bg-forest-100 text-forest-700",
  Pupa:  "bg-soil-200 text-soil-700",
  Adult: "bg-emerald-100 text-emerald-700",
};

const STATUS_COLOR: Record<string, string> = {
  Healthy: "bg-green-100 text-green-700",
  Sick:    "bg-red-100 text-red-600",
  Dead:    "bg-gray-200 text-gray-500",
  Sold:    "bg-blue-100 text-blue-600",
};

interface BeetleCardProps {
  beetle: BeetleSummary;
}

export default function BeetleCard({ beetle }: BeetleCardProps) {
  return (
    <Link href={`/beetles/${beetle._id}`} className="card flex items-center gap-3 active:bg-gray-50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">{beetle.beetleId}</span>
          {beetle.name && <span className="text-gray-500 text-xs">({beetle.name})</span>}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STAGE_COLOR[beetle.stage] ?? "bg-gray-100 text-gray-600"}`}>
            {beetle.stage}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[beetle.status] ?? "bg-gray-100 text-gray-600"}`}>
            {beetle.status}
          </span>
          {(beetle.quantity ?? 1) > 1 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
              ×{beetle.quantity}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          📦 {beetle.containerCode} · {beetle.species}
          {beetle.currentWeightGrams !== undefined && ` · ${beetle.currentWeightGrams} g`}
        </p>
      </div>
      <ChevronRight size={18} className="text-gray-300 shrink-0" />
    </Link>
  );
}
