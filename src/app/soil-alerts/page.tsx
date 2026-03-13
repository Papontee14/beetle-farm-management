"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, differenceInCalendarDays } from "date-fns";
import { th } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  AlertTriangle, Leaf, CheckCircle2, Clock, CalendarCheck, HelpCircle, Loader2,
} from "lucide-react";
import { BeetleSummary } from "@/types";

type SoilGroup = "overdue" | "urgent" | "upcoming" | "ok" | "none";

interface GroupedBeetle extends BeetleSummary {
  soilGroup: SoilGroup;
  daysUntil: number | null; // negative = overdue
}

function classifyBeetle(b: BeetleSummary, now: Date): GroupedBeetle {
  if (!b.nextSoilChange) return { ...b, soilGroup: "none", daysUntil: null };
  const days = differenceInCalendarDays(new Date(b.nextSoilChange), now);
  const group: SoilGroup =
    days < 0  ? "overdue" :
    days <= 7  ? "urgent"  :
    days <= 30 ? "upcoming" :
                 "ok";
  return { ...b, soilGroup: group, daysUntil: days };
}

export default function SoilAlertsPage() {
  const [all, setAll]       = useState<GroupedBeetle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]     = useState<string | null>(null);
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
    const days = Number(daysMap[id] ?? 30);
    try {
      const res = await fetch("/api/soil-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beetleId: id, daysUntilNext: days }),
      });
      if (res.ok) {
        toast.success(`เปลี่ยนแมท ${containerCode} เรียบร้อย นัดครั้งต่อไปใน ${days} วัน`);
        load();
      } else toast.error("เกิดข้อผิดพลาด");
    } finally { setBusy(null); }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const overdue  = all.filter((b) => b.soilGroup === "overdue");
  const urgent   = all.filter((b) => b.soilGroup === "urgent");
  const upcoming = all.filter((b) => b.soilGroup === "upcoming");
  const ok       = all.filter((b) => b.soilGroup === "ok");
  const none     = all.filter((b) => b.soilGroup === "none");

  return (
    <div className="space-y-4 pb-8">
      {/* Page header */}
      <div className="flex items-center gap-2 pt-2">
        <Leaf size={22} className="text-soil-600" />
        <h1 className="text-xl font-bold text-forest-800">ภาพรวมเปลี่ยนแมท</h1>
        <div className="ml-auto flex gap-2 items-center">
          {overdue.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              เกินกำหนด {overdue.length}
            </span>
          )}
          {urgent.length > 0 && (
            <span className="bg-orange-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              ด่วน {urgent.length}
            </span>
          )}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard count={overdue.length} label="เกินกำหนด" color="bg-red-100 text-red-700" icon="🔴" />
        <SummaryCard count={urgent.length}  label="≤ 7 วัน"    color="bg-orange-100 text-orange-700" icon="🟠" />
        <SummaryCard count={upcoming.length} label="8–30 วัน"  color="bg-yellow-100 text-yellow-700" icon="🟡" />
        <SummaryCard count={ok.length}       label="> 30 วัน"  color="bg-green-100 text-green-700"  icon="🟢" />
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <Section
          title="🔴 เกินกำหนด"
          badge={overdue.length}
          badgeColor="bg-red-500"
        >
          {overdue.map((b) => (
            <BeetleSoilRow
              key={b._id} beetle={b} busy={busy === b._id}
              daysInput={daysMap[b._id] ?? "30"}
              onDaysChange={(v) => setDaysMap((m) => ({ ...m, [b._id]: v }))}
              onDone={() => handleDone(b._id, b.containerCode)}
            />
          ))}
        </Section>
      )}

      {/* Urgent (≤ 7 days) */}
      {urgent.length > 0 && (
        <Section
          title="🟠 ถึงกำหนดภายใน 7 วัน"
          badge={urgent.length}
          badgeColor="bg-orange-400"
        >
          {urgent.map((b) => (
            <BeetleSoilRow
              key={b._id} beetle={b} busy={busy === b._id}
              daysInput={daysMap[b._id] ?? "30"}
              onDaysChange={(v) => setDaysMap((m) => ({ ...m, [b._id]: v }))}
              onDone={() => handleDone(b._id, b.containerCode)}
            />
          ))}
        </Section>
      )}

      {/* Upcoming (8-30 days) */}
      {upcoming.length > 0 && (
        <Section title="🟡 ภายใน 8–30 วัน" badge={upcoming.length} badgeColor="bg-yellow-400">
          {upcoming.map((b) => (
            <BeetleSoilRowCompact key={b._id} beetle={b} />
          ))}
        </Section>
      )}

      {/* OK (>30 days) */}
      {ok.length > 0 && (
        <Section title="🟢 ยังเหลือเวลา (> 30 วัน)" badge={ok.length} badgeColor="bg-green-500">
          {ok.map((b) => (
            <BeetleSoilRowCompact key={b._id} beetle={b} />
          ))}
        </Section>
      )}

      {/* No schedule */}
      {none.length > 0 && (
        <Section title="⚪ ยังไม่มีกำหนดเปลี่ยนแมท" badge={none.length} badgeColor="bg-gray-400">
          {none.map((b) => (
            <BeetleSoilRowCompact key={b._id} beetle={b} />
          ))}
        </Section>
      )}

      {all.length === 0 && (
        <div className="card text-center py-10 text-sm text-gray-400">
          <AlertTriangle className="mx-auto mb-2 text-gray-300" size={28} />
          ยังไม่มีข้อมูลด้วง
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function SummaryCard({
  count, label, color, icon,
}: { count: number; label: string; color: string; icon: string }) {
  return (
    <div className={`rounded-2xl p-3 flex flex-col items-center gap-1 ${color} shadow-sm`}>
      <span className="text-xl">{icon}</span>
      <p className="text-2xl font-extrabold leading-none">{count}</p>
      <p className="text-xs font-semibold text-center">{label}</p>
    </div>
  );
}

function Section({
  title, badge, badgeColor, children,
}: { title: string; badge: number; badgeColor: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
        <span className={`${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
          {badge}
        </span>
      </div>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function BeetleSoilRow({
  beetle, busy, daysInput, onDaysChange, onDone,
}: {
  beetle: GroupedBeetle;
  busy: boolean;
  daysInput: string;
  onDaysChange: (v: string) => void;
  onDone: () => void;
}) {
  const overdue = (beetle.daysUntil ?? 0) < 0;
  return (
    <li className="card flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">
          📦 {beetle.containerCode}
          <Link href={`/beetles/${beetle._id}`} className="ml-2 text-forest-600 underline underline-offset-2 text-xs">
            {beetle.beetleId}
          </Link>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {beetle.species} · {beetle.stage}
          {beetle.nextSoilChange && (
            <span className={`ml-1 font-medium ${overdue ? "text-red-500" : "text-orange-500"}`}>
              · {overdue
                ? `เกิน ${Math.abs(beetle.daysUntil ?? 0)} วัน`
                : `อีก ${beetle.daysUntil} วัน`}
            </span>
          )}
        </p>
        {beetle.nextSoilChange && (
          <p className="text-xs text-gray-400">
            ครบ {format(new Date(beetle.nextSoilChange), "d MMM yy", { locale: th })}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={daysInput}
          onChange={(e) => onDaysChange(e.target.value)}
          className="input-field !py-1.5 !min-h-0 text-xs w-24"
          title="นัดครั้งต่อไป"
        >
          {["14", "21", "30", "45", "60", "90"].map((d) => (
            <option key={d} value={d}>{d} วัน</option>
          ))}
        </select>
        <button
          onClick={onDone}
          disabled={busy}
          className="btn-primary !py-2 !px-3 text-xs"
        >
          {busy
            ? <Loader2 size={14} className="animate-spin" />
            : <CheckCircle2 size={14} />}
          เปลี่ยนแมท
        </button>
      </div>
    </li>
  );
}

function BeetleSoilRowCompact({ beetle }: { beetle: GroupedBeetle }) {
  return (
    <li className="card py-2.5 flex items-center gap-3">
      <CalendarCheck size={14} className="text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          📦 {beetle.containerCode} ·
          <Link href={`/beetles/${beetle._id}`} className="ml-1 text-forest-600 underline underline-offset-2">
            {beetle.beetleId}
          </Link>
        </p>
        <p className="text-xs text-gray-400">
          {beetle.stage} · {beetle.species}
        </p>
      </div>
      <div className="text-right shrink-0">
        {beetle.nextSoilChange ? (
          <>
            <p className="text-xs font-semibold text-gray-600">
              {beetle.daysUntil != null
                ? `อีก ${beetle.daysUntil} วัน`
                : "ไม่มีกำหนด"}
            </p>
            <p className="text-xs text-gray-400">
              {format(new Date(beetle.nextSoilChange), "d MMM yy", { locale: th })}
            </p>
          </>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </li>
  );
}
