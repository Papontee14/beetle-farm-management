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
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Leaf,
  Scale,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
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
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
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
  const aliveCount = s.totalBeetles - (s.byStatus.Dead ?? 0) - (s.byStatus.Sold ?? 0);
  const urgentCount = s.soilChangeDueToday.length + s.sickBeetles.length;

  const overviewCards = [
    {
      title: "สุขภาพดี",
      value: s.byStatus.Healthy,
      subtitle: "พร้อมเลี้ยงต่อเนื่อง",
      icon: HeartPulse,
      tone: "text-forest-700 bg-forest-100",
    },
    {
      title: "ป่วย",
      value: s.byStatus.Sick,
      subtitle: "ต้องติดตามอาการ",
      icon: AlertTriangle,
      tone: "text-red-600 bg-red-100",
    },
    {
      title: "เปลี่ยนแมทวันนี้",
      value: s.soilChangeDueToday.length,
      subtitle: "งานเร่งด่วน",
      icon: Leaf,
      tone: "text-soil-700 bg-soil-200",
    },
    {
      title: "ยังไม่ได้ชั่ง >14 วัน",
      value: s.notWeighedRecently.length,
      subtitle: "ควรเช็กน้ำหนัก",
      icon: Scale,
      tone: "text-amber-700 bg-amber-100",
    },
  ];

  const stageRows = STAGE_META.map((meta) => {
    const count = s.byStage[meta.stage] ?? 0;
    const ratio = s.totalBeetles > 0 ? Math.round((count / s.totalBeetles) * 100) : 0;
    return { ...meta, count, ratio };
  });

  return (
    <div className="space-y-6 pb-2 md:space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-forest-200 bg-gradient-to-br from-forest-700 via-forest-600 to-forest-800 p-5 text-white shadow-lg md:p-7">
        <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-forest-300/20 blur-2xl" />

        <div className="relative grid grid-cols-1 gap-5 md:grid-cols-3 md:items-end">
          <div className="md:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-forest-100">Beetle Farm Snapshot</p>
            <h1 className="mt-1 text-2xl font-extrabold leading-tight md:text-3xl">ภาพรวมฟาร์มด้วงวันนี้</h1>
            <p className="mt-2 text-sm text-forest-100/90">
              โฟกัสสิ่งที่ต้องทำก่อนเป็นอันดับแรก และเห็นสัดส่วนประชากรด้วงแบบทันที
            </p>
            <p className="mt-3 text-xs text-forest-100/90">
              {new Date().toLocaleDateString("th-TH", { dateStyle: "full" })}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[11px] text-forest-100">ด้วงทั้งหมด</p>
              <p className="mt-1 text-3xl font-black">{s.totalBeetles}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[11px] text-forest-100">ยังอยู่ในฟาร์ม</p>
              <p className="mt-1 text-3xl font-black">{aliveCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[11px] text-forest-100">รวมหนอน</p>
              <p className="mt-1 text-2xl font-extrabold">{larvaCount}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[11px] text-forest-100">งานเร่งด่วน</p>
              <p className="mt-1 text-2xl font-extrabold">{urgentCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {overviewCards.map(({ title, value, subtitle, icon: Icon, tone }) => (
          <article key={title} className="card !p-3 md:!p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold text-gray-500">{title}</p>
                <p className="mt-1 text-2xl font-black text-gray-800 md:text-3xl">{value}</p>
              </div>
              <span className={`rounded-xl p-2 ${tone}`}>
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-2 text-[11px] text-gray-500">{subtitle}</p>
          </article>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 items-start">
        <div className="md:col-span-2 space-y-5">
          <section className="card !p-4 md:!p-5">
            <div className="mb-3 flex items-center gap-2">
              <Bug size={15} className="text-forest-700" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">โครงสร้างประชากรด้วง</h2>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {STAGE_META.map((m) => (
                <StageCard
                  key={m.stage}
                  label={m.label}
                  count={s.byStage[m.stage] ?? 0}
                  color={m.color}
                  icon={m.icon}
                />
              ))}
            </div>

            <div className="mt-4 space-y-2.5">
              {stageRows.map((row) => (
                <div key={row.stage} className="grid grid-cols-[66px_1fr_auto] items-center gap-2 text-xs">
                  <p className="font-semibold text-gray-600">{row.label}</p>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-forest-400 to-forest-600 transition-all"
                      style={{ width: `${Math.max(4, row.ratio)}%` }}
                    />
                  </div>
                  <p className="w-[68px] whitespace-nowrap text-right font-bold text-gray-700">
                    {row.count} ({row.ratio}%)
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <article className="card !p-4">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={15} className="text-forest-700" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">สรุปสายพันธุ์</h2>
              </div>

              {s.speciesBreakdown.length === 0 ? (
                <p className="text-sm text-gray-400">ยังไม่มีข้อมูลสายพันธุ์</p>
              ) : (
                <div className="space-y-2">
                  {s.speciesBreakdown.slice(0, 5).map(({ species, count }) => (
                    <div key={species} className="flex items-center gap-2 text-sm">
                      <p className="flex-1 truncate text-gray-600">{species}</p>
                      <span className="rounded-md bg-forest-50 px-2 py-0.5 text-xs font-bold text-forest-700">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="card !p-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">เมนูลัด</h2>
              <p className="mt-1 text-xs text-gray-500">เข้าถึงงานที่ใช้บ่อยใน 1 คลิก</p>

              <div className="mt-4 space-y-2">
                <Link href="/beetles/new" className="btn-primary w-full justify-between">
                  + เพิ่มด้วงใหม่
                  <ArrowRight size={16} />
                </Link>
                <Link href="/beetles" className="btn-secondary w-full justify-between">
                  รายการด้วงทั้งหมด
                  <ArrowRight size={16} />
                </Link>
                <Link href="/soil-alerts" className="btn-secondary w-full justify-between">
                  รายการแจ้งเตือนเปลี่ยนแมท
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          </section>

          <section className="card !p-4 md:!p-5">
            <div className="mb-2 flex items-center gap-2">
              <Clock3 size={15} className="text-amber-600" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">ยังไม่ได้ชั่งนานกว่า 14 วัน</h2>
              {s.notWeighedRecently.length > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  {s.notWeighedRecently.length}
                </span>
              )}
            </div>

            {s.notWeighedRecently.length === 0 ? (
              <div className="rounded-xl border border-dashed border-forest-200 bg-forest-50 p-3 text-sm text-forest-700">
                ทุกตัวมีการชั่งน้ำหนักภายใน 14 วันล่าสุด
              </div>
            ) : (
              <div className="space-y-1">
                {s.notWeighedRecently.slice(0, 6).map((b: BeetleSummary) => (
                  <Link
                    key={b._id}
                    href={`/beetles/${b._id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-amber-50"
                  >
                    <span className="font-bold text-forest-700 shrink-0">{b.beetleId}</span>
                    <span className="truncate text-gray-500">{b.name || b.species}</span>
                    <span className="ml-auto rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{b.stage}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-5 pb-4 md:pb-0">
          <section>
            <div className="mb-2 flex items-center gap-2">
              <Leaf size={16} className="text-soil-700" />
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">ถึงกำหนดเปลี่ยนแมทวันนี้</h2>
              {s.soilChangeDueToday.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {s.soilChangeDueToday.length}
                </span>
              )}
            </div>
            <SoilAlertList items={s.soilChangeDueToday} onDone={() => window.location.reload()} />
          </section>

          {s.soilChangeDueThisWeek.length > 0 && (
            <section>
              <div className="mb-2 flex items-center gap-2">
                <ShieldCheck size={16} className="text-forest-500" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">เปลี่ยนแมทภายใน 7 วัน</h2>
              </div>
              <SoilAlertList items={s.soilChangeDueThisWeek} compact />
            </section>
          )}

          <section className="card !p-4 border-red-100">
            <div className="mb-2 flex items-center gap-2 text-red-600">
              <AlertTriangle size={15} />
              <h2 className="text-sm font-bold uppercase tracking-wide">ด้วงป่วย</h2>
              {s.sickBeetles.length > 0 && (
                <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                  {s.sickBeetles.length}
                </span>
              )}
            </div>

            {s.sickBeetles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-forest-200 bg-forest-50 p-3 text-sm text-forest-700">
                ไม่พบด้วงป่วยในรายการปัจจุบัน
              </div>
            ) : (
              <div className="space-y-1">
                {s.sickBeetles.map((b: BeetleSummary) => (
                  <Link
                    key={b._id}
                    href={`/beetles/${b._id}`}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-red-50"
                  >
                    <span className="font-bold text-red-600 shrink-0">{b.beetleId}</span>
                    <span className="truncate text-gray-500">{b.name || b.species}</span>
                    <span className="ml-auto rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">{b.stage}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

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

      <div className="text-center text-xs text-gray-400 pb-2">อัปเดตจากข้อมูลล่าสุดของระบบจัดการฟาร์ม</div>
    </div>
  );
}
