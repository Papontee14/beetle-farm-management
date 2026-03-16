"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { th } from "date-fns/locale";
import toast from "react-hot-toast";
import { CheckCircle2, Leaf, Loader2, Plus } from "lucide-react";
import { BeetleSummary } from "@/types";
import FarmSelect from "@/components/FarmSelect";

const DAYS_OPTIONS = [
  { value: "7",  label: "7 วัน"  },
  { value: "14", label: "14 วัน" },
  { value: "21", label: "21 วัน" },
  { value: "30", label: "30 วัน" },
  { value: "45", label: "45 วัน" },
  { value: "60", label: "60 วัน" },
  { value: "90", label: "90 วัน" },
];

const STAGE_ICON: Record<string, string> = {
  Egg: "🥚", L1: "🐛", L2: "🐛", L3: "🐛", Pupa: "🫘", Adult: "🪲",
};

type SoilGroup = "overdue" | "urgent" | "upcoming" | "ok" | "none";

interface GroupedBeetle extends BeetleSummary {
  soilGroup: SoilGroup;
  daysUntil: number | null;
}

function classifyBeetle(b: BeetleSummary, now: Date): GroupedBeetle {
  if (!b.nextSoilChange) return { ...b, soilGroup: "none", daysUntil: null };
  const days = differenceInCalendarDays(new Date(b.nextSoilChange), now);
  const group: SoilGroup =
    days < 0   ? "overdue"  :
    days <= 7  ? "urgent"   :
    days <= 30 ? "upcoming" : "ok";
  return { ...b, soilGroup: group, daysUntil: days };
}

export default function SoilAlertsPage() {
  const [all, setAll]         = useState<GroupedBeetle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState<string | null>(null);
  const [daysMap, setDaysMap] = useState<Record<string, string>>({});

  function load() {
    setLoading(true);
    fetch("/api/soil-alerts?all=true")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const now = new Date();
          setAll((res.data as BeetleSummary[]).map((b) => classifyBeetle(b, now)));
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDone(id: string, containerCode: string) {
    setBusy(id);
    const days = Number(daysMap[id] ?? "30");
    try {
      const res = await fetch("/api/soil-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beetleId: id, daysUntilNext: days }),
      });
      if (res.ok) {
        toast.success(`เปลี่ยนแมท ${containerCode} เรียบร้อย · นัดครั้งต่อไปใน ${days} วัน`);
        load();
      } else toast.error("เกิดข้อผิดพลาด");
    } finally { setBusy(null); }
  }

  const overdue  = all.filter((b) => b.soilGroup === "overdue");
  const urgent   = all.filter((b) => b.soilGroup === "urgent");
  const upcoming = all.filter((b) => b.soilGroup === "upcoming");
  const ok       = all.filter((b) => b.soilGroup === "ok");
  const none     = all.filter((b) => b.soilGroup === "none");

  if (loading) return (
    <div className="space-y-3 pt-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[76px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 rounded-xl bg-forest-100 flex items-center justify-center shrink-0">
          <Leaf size={20} className="text-forest-600" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-forest-800 leading-tight">เปลี่ยนแมท</h1>
          <p className="text-xs text-gray-400">{all.length} กล่องทั้งหมด</p>
        </div>
        {(overdue.length > 0 || urgent.length > 0) && (
          <div className="flex gap-1.5 shrink-0">
            {overdue.length > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                เกินกำหนด {overdue.length}
              </span>
            )}
            {urgent.length > 0 && (
              <span className="bg-orange-400 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                ด่วน {urgent.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard count={overdue.length}  label="เกินกำหนด" bg="bg-red-50"    border="border-red-200"    bar="bg-red-500"    numCls="text-red-600"    />
        <SummaryCard count={urgent.length}   label="≤ 7 วัน"   bg="bg-orange-50" border="border-orange-200" bar="bg-orange-400" numCls="text-orange-600" />
        <SummaryCard count={upcoming.length} label="8–30 วัน"  bg="bg-amber-50"  border="border-amber-200"  bar="bg-amber-400"  numCls="text-amber-600"  />
        <SummaryCard count={ok.length}       label="> 30 วัน"  bg="bg-green-50"  border="border-green-200"  bar="bg-green-500"  numCls="text-green-600"  />
      </div>

      {/* ── Overdue ─────────────────────────────────────────── */}
      {overdue.length > 0 && (
        <SoilSection title="เกินกำหนด" dot="bg-red-500" badge={overdue.length} badgeCls="bg-red-500 text-white">
          {overdue.map((b) => (
            <ActionRow
              key={b._id} beetle={b} busy={busy === b._id}
              daysInput={daysMap[b._id] ?? "30"}
              onDaysChange={(v) => setDaysMap((m) => ({ ...m, [b._id]: v }))}
              onDone={() => handleDone(b._id, b.containerCode)}
            />
          ))}
        </SoilSection>
      )}

      {/* ── Urgent (≤ 7 days) ───────────────────────────────── */}
      {urgent.length > 0 && (
        <SoilSection title="ถึงกำหนดภายใน 7 วัน" dot="bg-orange-400" badge={urgent.length} badgeCls="bg-orange-400 text-white">
          {urgent.map((b) => (
            <ActionRow
              key={b._id} beetle={b} busy={busy === b._id}
              daysInput={daysMap[b._id] ?? "30"}
              onDaysChange={(v) => setDaysMap((m) => ({ ...m, [b._id]: v }))}
              onDone={() => handleDone(b._id, b.containerCode)}
            />
          ))}
        </SoilSection>
      )}

      {/* ── Upcoming (8–30 days) ────────────────────────────── */}
      {upcoming.length > 0 && (
        <SoilSection title="ภายใน 8–30 วัน" dot="bg-amber-400" badge={upcoming.length} badgeCls="bg-amber-400 text-white">
          {upcoming.map((b) => (
            <InfoRow key={b._id} beetle={b} />
          ))}
        </SoilSection>
      )}

      {/* ── OK (> 30 days) ──────────────────────────────────── */}
      {ok.length > 0 && (
        <SoilSection title="ยังเหลือเวลา (> 30 วัน)" dot="bg-green-500" badge={ok.length} badgeCls="bg-green-500 text-white">
          {ok.map((b) => (
            <InfoRow key={b._id} beetle={b} />
          ))}
        </SoilSection>
      )}

      {/* ── No schedule ─────────────────────────────────────── */}
      {none.length > 0 && (
        <SoilSection title="ยังไม่มีกำหนดเปลี่ยนแมท" dot="bg-gray-400" badge={none.length} badgeCls="bg-gray-400 text-white">
          {none.map((b) => (
            <InfoRow key={b._id} beetle={b} />
          ))}
        </SoilSection>
      )}

      {/* ── Empty state ─────────────────────────────────────── */}
      {all.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center">
            <Leaf size={32} className="text-forest-400" strokeWidth={1.4} />
          </div>
          <p className="text-sm font-semibold text-gray-500">ยังไม่มีข้อมูลกล่องด้วง</p>
          <Link href="/beetles/new" className="btn-primary !py-2 !px-4 text-sm gap-1.5">
            <Plus size={14} /> เพิ่มด้วงใหม่
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function SummaryCard({ count, label, bg, border, bar, numCls }: {
  count: number; label: string; bg: string; border: string; bar: string; numCls: string;
}) {
  return (
    <div className={`rounded-2xl border ${bg} ${border} overflow-hidden shadow-sm`}>
      <div className={`h-1.5 w-full ${bar}`} />
      <div className="px-4 py-3">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
        <div className="mt-1 flex items-end justify-between">
          <p className={`text-3xl font-black leading-none ${numCls}`}>{count}</p>
          <span className="text-[10px] font-bold text-gray-500 bg-white/80 border border-gray-200 rounded-full px-2 py-0.5">
            กล่อง
          </span>
        </div>
      </div>
    </div>
  );
}

function SoilSection({ title, dot, badge, badgeCls, children }: {
  title: string; dot: string; badge: number; badgeCls: string; children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
      </div>
      <ul className="space-y-2.5">{children}</ul>
    </section>
  );
}

function ActionRow({ beetle, busy, daysInput, onDaysChange, onDone }: {
  beetle: GroupedBeetle;
  busy: boolean;
  daysInput: string;
  onDaysChange: (v: string) => void;
  onDone: () => void;
}) {
  const isOverdue = (beetle.daysUntil ?? 0) < 0;
  const stageIcon = STAGE_ICON[beetle.stage] ?? "🪲";
  return (
    <li className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${
      isOverdue ? "border-l-red-400" : "border-l-orange-400"
    } px-4 py-3 flex items-center gap-3`}>

      {/* Stage icon */}
      <div className="w-11 h-11 rounded-xl bg-forest-100 flex items-center justify-center text-xl shrink-0">
        {stageIcon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-sm text-gray-800">{beetle.containerCode}</span>
          <Link
            href={`/beetles/${beetle._id}`}
            className="text-forest-600 text-xs font-semibold hover:underline underline-offset-2"
          >
            {beetle.beetleId}
          </Link>
          {beetle.daysUntil !== null && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              isOverdue ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
            }`}>
              {isOverdue
                ? `เกิน ${Math.abs(beetle.daysUntil)} วัน`
                : `อีก ${beetle.daysUntil} วัน`}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {beetle.species} · {beetle.stage}
          {beetle.nextSoilChange && (
            <span> · ครบ {format(new Date(beetle.nextSoilChange), "d MMM yy", { locale: th })}</span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <FarmSelect
          value={daysInput}
          onChange={onDaysChange}
          options={DAYS_OPTIONS}
          compact
          className="w-28"
        />
        <button
          onClick={onDone}
          disabled={busy}
          className="btn-primary !py-2 !px-3 text-xs whitespace-nowrap gap-1.5"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          เปลี่ยนแมท
        </button>
      </div>
    </li>
  );
}

function InfoRow({ beetle }: { beetle: GroupedBeetle }) {
  const stageIcon = STAGE_ICON[beetle.stage] ?? "🪲";
  return (
    <li className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-base shrink-0">
        {stageIcon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-gray-700">{beetle.containerCode}</span>
          <Link href={`/beetles/${beetle._id}`} className="text-forest-600 text-xs hover:underline underline-offset-2">
            {beetle.beetleId}
          </Link>
        </div>
        <p className="text-xs text-gray-400">{beetle.stage} · {beetle.species}</p>
      </div>
      <div className="text-right shrink-0">
        {beetle.nextSoilChange ? (
          <>
            <p className="text-xs font-bold text-gray-600">
              {beetle.daysUntil != null ? `อีก ${beetle.daysUntil} วัน` : "—"}
            </p>
            <p className="text-[10px] text-gray-400">
              {format(new Date(beetle.nextSoilChange), "d MMM yy", { locale: th })}
            </p>
          </>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </div>
    </li>
  );
}
