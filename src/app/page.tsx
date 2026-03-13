/**
 * Prompt: สร้าง React Functional Component ชื่อ Dashboard สำหรับหน้าจอโทรศัพท์มือถือ
 * 1. ใช้ Tailwind CSS แบบ Minimalist โทนสีเขียวธรรมชาติ
 * 2. มี Card จำนวน 4 ใบ แสดงสรุปจำนวนด้วงในแต่ละระยะ (Egg, Larvae, Pupa, Adult)
 * 3. มี Section "To-Do List" เป็น List แสดงรหัสกล่องด้วงที่ถึงกำหนดเปลี่ยนดิน
 * 4. ทำให้เป็น Responsive Layout (Mobile-first)
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bug, CheckCircle2, Leaf, Scale, ShieldCheck, TrendingUp } from "lucide-react";
import { DashboardStats, BeetleSummary } from "@/types";
import StageCard from "@/components/StageCard";
import SoilAlertList from "@/components/SoilAlertList";

const STAGE_META = [
  { stage: "Egg",   label: "ไข่",    color: "bg-yellow-100 text-yellow-700", icon: "🥚" },
  { stage: "L1",    label: "L1",     color: "bg-lime-100 text-lime-700",     icon: "🐛" },
  { stage: "L2",    label: "L2",     color: "bg-green-100 text-green-700",   icon: "🐛" },
  { stage: "L3",    label: "L3",     color: "bg-forest-100 text-forest-700", icon: "🐛" },
  { stage: "Pupa",  label: "ดักแด้", color: "bg-soil-200 text-soil-700",     icon: "🫘" },
  { stage: "Adult", label: "ตัวเต็มวัย", color: "bg-emerald-100 text-emerald-700", icon: "🪲" },
] as const;

export default function DashboardPage() {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
        else setError(res.message);
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-forest-600">
        <div className="w-10 h-10 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูล…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card mt-6 flex items-center gap-3 text-red-600">
        <AlertTriangle size={20} />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const s = stats!;
  const larvaCount = (s.byStage.L1 ?? 0) + (s.byStage.L2 ?? 0) + (s.byStage.L3 ?? 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-forest-800">ภาพรวมฟาร์ม</h1>
          <p className="text-xs text-gray-500">
            {new Date().toLocaleDateString("th-TH", { dateStyle: "full" })}
          </p>
        </div>
        <div className="card !p-3 text-center min-w-[72px]">
          <p className="text-2xl font-extrabold text-forest-700">{s.totalBeetles}</p>
          <p className="text-xs text-gray-500">ตัวทั้งหมด</p>
        </div>
      </div>

      {/* Desktop: 2-column grid; Mobile: single column */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 items-start">

        {/* Left column — stats & stage overview */}
        <div className="md:col-span-2 space-y-5">
          {/* Status pills */}
          <div className="flex gap-2 flex-wrap">
            <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
              <CheckCircle2 size={12} /> สุขภาพดี {s.byStatus.Healthy}
            </span>
            <span className="flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-3 py-1 rounded-full">
              <AlertTriangle size={12} /> ป่วย {s.byStatus.Sick}
            </span>
            <span className="flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1 rounded-full">
              <Bug size={12} /> รวมหนอน {larvaCount}
            </span>
          </div>

          {/* Stage cards — 3 cols on mobile, 6 cols on desktop */}
          <section>
            <h2 className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">
              จำนวนตามระยะ
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {STAGE_META.map((m) => (
                <StageCard
                  key={m.stage}
                  stage={m.stage}
                  label={m.label}
                  count={s.byStage[m.stage] ?? 0}
                  color={m.color}
                  icon={m.icon}
                />
              ))}
            </div>
          </section>

          {/* Quick actions */}
          <section className="pb-4 md:pb-0">
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-3">เมนูลัด</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/beetles/new" className="btn-primary text-center">+ เพิ่มด้วงใหม่</Link>
              <Link href="/beetles" className="btn-secondary text-center">รายการด้วงทั้งหมด</Link>
            </div>
          </section>

          {/* Sick beetles — all screen sizes, only when there are sick */}
          {s.sickBeetles.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <AlertTriangle size={14} />
                ด้วงป่วย
                <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {s.sickBeetles.length} ตัว
                </span>
              </h2>
              <div className="card border-red-100 space-y-1">
                {s.sickBeetles.map((b: BeetleSummary) => (
                  <Link key={b._id} href={`/beetles/${b._id}`}
                    className="flex items-center gap-2 text-sm hover:bg-red-50/60 -mx-2 px-2 py-1.5 rounded transition-colors">
                    <span className="font-mono font-bold text-red-600 shrink-0">{b.beetleId}</span>
                    <span className="text-gray-500 truncate flex-1">{b.name || b.species}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">{b.stage}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Species breakdown — desktop only */}
          {s.speciesBreakdown.length > 0 && (
            <section className="hidden md:block">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                <TrendingUp size={14} /> แจกแจงตามสายพันธุ์
              </h2>
              <div className="card space-y-2">
                {s.speciesBreakdown.map(({ species, count }: { species: string; count: number }) => (
                  <div key={species} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate text-gray-700 text-xs">{species}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-2 bg-forest-300 rounded-full transition-all"
                        style={{ width: `${Math.max(8, Math.round((count / s.totalBeetles) * 72))}px` }} />
                      <span className="text-xs font-bold text-forest-700 w-5 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Not weighed recently — desktop only */}
          {s.notWeighedRecently.length > 0 && (
            <section className="hidden md:block pb-4">
              <h2 className="text-sm font-bold text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Scale size={14} /> ยังไม่ได้ชั่งนานกว่า 14 วัน
                <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {s.notWeighedRecently.length} ตัว
                </span>
              </h2>
              <div className="card space-y-1">
                {s.notWeighedRecently.map((b: BeetleSummary) => (
                  <Link key={b._id} href={`/beetles/${b._id}`}
                    className="flex items-center gap-2 text-sm hover:bg-amber-50/60 -mx-2 px-2 py-1.5 rounded transition-colors">
                    <span className="font-mono font-bold text-forest-700 shrink-0">{b.beetleId}</span>
                    <span className="text-gray-500 truncate flex-1">{b.name || b.species}</span>
                    <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded shrink-0">{b.stage}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column — soil alerts */}
        <div className="space-y-5 pb-4 md:pb-0">
          {/* Soil change to-do list */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Leaf size={16} className="text-soil-600" />
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                ถึงกำหนดเปลี่ยนแมทวันนี้
              </h2>
              {s.soilChangeDueToday.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {s.soilChangeDueToday.length}
                </span>
              )}
            </div>
            <SoilAlertList items={s.soilChangeDueToday} onDone={() => window.location.reload()} />
          </section>

          {/* Coming up this week */}
          {s.soilChangeDueThisWeek.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-forest-500" />
                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide">
                  เปลี่ยนแมทภายใน 7 วัน
                </h2>
              </div>
              <SoilAlertList items={s.soilChangeDueThisWeek} compact />
            </section>
          )}
        </div>

      </div>
    </div>
  );
}
