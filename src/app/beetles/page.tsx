"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Bug, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { BeetleSummary, BeetleStage, BeetleStatus, BeetleSex } from "@/types";
import BeetleCard from "@/components/BeetleCard";
import FarmSelect from "@/components/FarmSelect";

const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];
const SEXES: BeetleSex[] = ["Male", "Female", "Unknown"];

const STAGE_QUICK: { value: BeetleStage | ""; label: string; icon: string }[] = [
  { value: "",      label: "ทั้งหมด",     icon: "🪲" },
  { value: "Egg",   label: "ไข่",         icon: "🥚" },
  { value: "L1",    label: "L1",          icon: "🐛" },
  { value: "L2",    label: "L2",          icon: "🐛" },
  { value: "L3",    label: "L3",          icon: "🐛" },
  { value: "Pupa",  label: "ดักแด้",     icon: "🫘" },
  { value: "Adult", label: "ตัวเต็มวัย", icon: "🪲" },
];

function BeetlesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [beetles, setBeetles]     = useState<BeetleSummary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [speciesList, setSpeciesList] = useState<string[]>([]);
  const [showFilter, setShowFilter]   = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filters — init from URL
  const [search,        setSearch]        = useState(searchParams.get("search")        ?? "");
  const [stage,         setStage]         = useState(searchParams.get("stage")         ?? "");
  const [status,        setStatus]        = useState(searchParams.get("status")        ?? "");
  const [species,       setSpecies]       = useState(searchParams.get("species")       ?? "");
  const [sex,           setSex]           = useState(searchParams.get("sex")           ?? "");
  const [containerCode, setContainerCode] = useState(searchParams.get("containerCode") ?? "");
  const [weightMin,     setWeightMin]     = useState(searchParams.get("weightMin")     ?? "");
  const [weightMax,     setWeightMax]     = useState(searchParams.get("weightMax")     ?? "");
  const [fatherId,      setFatherId]      = useState(searchParams.get("fatherId")      ?? "");
  const [motherId,      setMotherId]      = useState(searchParams.get("motherId")      ?? "");

  // Initialize panel state from URL
  useState(() => {
    const p = searchParams;
    if (p.get("sex") || p.get("fatherId") || p.get("motherId") ||
        p.get("containerCode") || p.get("weightMin") || p.get("weightMax")) {
      setShowFilter(true); setShowAdvanced(true);
    } else if (p.get("status") || p.get("species")) {
      setShowFilter(true);
    }
  });

  const activeFilterCount = [status, species, sex, containerCode, weightMin, weightMax, fatherId, motherId].filter(Boolean).length;
  const hasFilters = !!(search || stage || activeFilterCount);

  function clearFilters() {
    setSearch(""); setStage(""); setStatus(""); setSpecies("");
    setSex(""); setContainerCode(""); setWeightMin(""); setWeightMax("");
    setFatherId(""); setMotherId("");
  }

  // Sync to URL
  const skipFirstSync = useRef(true);
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return; }
    const p = new URLSearchParams();
    if (search)        p.set("search",        search);
    if (stage)         p.set("stage",         stage);
    if (status)        p.set("status",        status);
    if (species)       p.set("species",       species);
    if (sex)           p.set("sex",           sex);
    if (containerCode) p.set("containerCode", containerCode);
    if (weightMin)     p.set("weightMin",     weightMin);
    if (weightMax)     p.set("weightMax",     weightMax);
    if (fatherId)      p.set("fatherId",      fatherId);
    if (motherId)      p.set("motherId",      motherId);
    router.replace(`/beetles${p.toString() ? `?${p}` : ""}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stage, status, species, sex, containerCode, weightMin, weightMax, fatherId, motherId]);

  // Fetch species list once
  useEffect(() => {
    fetch("/api/beetles")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const unique = Array.from(new Set<string>((res.data as BeetleSummary[]).map((b) => b.species))).sort();
          setSpeciesList(unique);
        }
      });
  }, []);

  // Fetch beetles on filter change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)        params.set("search",        search);
    if (stage)         params.set("stage",         stage);
    if (status)        params.set("status",        status);
    if (species)       params.set("species",       species);
    if (sex)           params.set("sex",           sex);
    if (containerCode) params.set("containerCode", containerCode);
    if (weightMin)     params.set("weightMin",     weightMin);
    if (weightMax)     params.set("weightMax",     weightMax);
    if (fatherId)      params.set("fatherId",      fatherId);
    if (motherId)      params.set("motherId",      motherId);
    fetch(`/api/beetles?${params}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setBeetles(res.data); })
      .finally(() => setLoading(false));
  }, [search, stage, status, species, sex, containerCode, weightMin, weightMax, fatherId, motherId]);

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold text-forest-800">รายการด้วง</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "กำลังโหลด…" : hasFilters
              ? `พบ ${beetles.length} รายการ`
              : `ทั้งหมด ${beetles.length} รายการ`}
          </p>
        </div>
        <Link href="/beetles/new" className="btn-primary !py-2.5 !px-4 gap-1.5 text-sm">
          <Plus size={15} /> เพิ่มด้วง
        </Link>
      </div>

      {/* ── Search bar ──────────────────────────────────────── */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="input-field pl-10 pr-10"
          placeholder="ค้นหา ID, ชื่อ, สายพันธุ์, กล่อง…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Quick stage chips ────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STAGE_QUICK.map((s) => (
          <button
            key={s.value}
            onClick={() => setStage(s.value)}
            className={`flex items-center gap-1.5 shrink-0 text-xs font-semibold px-3 py-2 rounded-full border transition-all
              ${stage === s.value
                ? "bg-forest-600 text-white border-forest-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-forest-400 hover:text-forest-700"}`}
          >
            <span className="text-sm leading-none">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`relative flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl border font-medium transition-colors shrink-0
            ${showFilter || activeFilterCount > 0
              ? "bg-forest-600 text-white border-forest-600"
              : "bg-white text-gray-600 border-gray-200 hover:border-forest-400"}`}
        >
          <SlidersHorizontal size={14} />
          ตัวกรอง
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Active tags */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          {status        && <Tag label={`สถานะ: ${status}`}         onRemove={() => setStatus("")} />}
          {species       && <Tag label={species}                     onRemove={() => setSpecies("")} />}
          {sex           && <Tag label={`เพศ: ${sex}`}              onRemove={() => setSex("")} />}
          {containerCode && <Tag label={`กล่อง: ${containerCode}`}  onRemove={() => setContainerCode("")} />}
          {weightMin     && <Tag label={`≥ ${weightMin} g`}         onRemove={() => setWeightMin("")} />}
          {weightMax     && <Tag label={`≤ ${weightMax} g`}         onRemove={() => setWeightMax("")} />}
          {fatherId      && <Tag label={`พ่อ: ${fatherId}`}         onRemove={() => setFatherId("")} />}
          {motherId      && <Tag label={`แม่: ${motherId}`}         onRemove={() => setMotherId("")} />}
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="shrink-0 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"
          >
            <X size={11} /> ล้างทั้งหมด
          </button>
        )}
      </div>

      {/* ── Filter panel ────────────────────────────────────── */}
      {showFilter && (
        <div className="card border-forest-200 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">สถานะสุขภาพ</label>
              <FarmSelect
                value={status} onChange={setStatus}
                options={[{ value: "", label: "ทั้งหมด" }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
              />
            </div>
            <div>
              <label className="label">สายพันธุ์</label>
              <FarmSelect
                value={species} onChange={setSpecies}
                options={[{ value: "", label: "ทั้งหมด" }, ...speciesList.map((s) => ({ value: s, label: s }))]}
              />
            </div>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-forest-700 font-semibold flex items-center gap-1 hover:underline"
          >
            {showAdvanced ? "▲ ซ่อนตัวกรองขั้นสูง" : "▼ ตัวกรองขั้นสูง"}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="label">เพศ</label>
                <FarmSelect value={sex} onChange={setSex}
                  options={[{ value: "", label: "ทั้งหมด" }, ...SEXES.map((s) => ({ value: s, label: s }))]}
                />
              </div>
              <div>
                <label className="label">รหัสกล่อง</label>
                <input className="input-field" placeholder="เช่น BOX-A"
                  value={containerCode} onChange={(e) => setContainerCode(e.target.value)} />
              </div>
              <div>
                <label className="label">น้ำหนักต่ำสุด (g)</label>
                <input className="input-field" type="number" min="0" placeholder="0"
                  value={weightMin} onChange={(e) => setWeightMin(e.target.value)} />
              </div>
              <div>
                <label className="label">น้ำหนักสูงสุด (g)</label>
                <input className="input-field" type="number" min="0" placeholder="999"
                  value={weightMax} onChange={(e) => setWeightMax(e.target.value)} />
              </div>
              <div>
                <label className="label">รหัสพ่อพันธุ์</label>
                <input className="input-field" placeholder="เช่น BTL-001"
                  value={fatherId} onChange={(e) => setFatherId(e.target.value)} />
              </div>
              <div>
                <label className="label">รหัสแม่พันธุ์</label>
                <input className="input-field" placeholder="เช่น BTL-002"
                  value={motherId} onChange={(e) => setMotherId(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── List ────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[72px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : beetles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-full bg-forest-100 flex items-center justify-center">
            <Bug size={32} className="text-forest-400" strokeWidth={1.4} />
          </div>
          <p className="text-sm font-semibold text-gray-500">ไม่พบข้อมูลด้วง</p>
          {hasFilters ? (
            <button onClick={clearFilters} className="text-xs text-forest-600 hover:underline font-medium">
              ล้างตัวกรองทั้งหมด
            </button>
          ) : (
            <Link href="/beetles/new" className="btn-primary !py-2 !px-4 text-sm gap-1.5">
              <Plus size={14} /> เพิ่มด้วงแรก
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {beetles.map((b) => (
            <li key={b._id}><BeetleCard beetle={b} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function BeetlesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-2.5 pt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-[72px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
        ))}
      </div>
    }>
      <BeetlesContent />
    </Suspense>
  );
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-forest-100 text-forest-800 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-forest-200">
      {label}
      <button onClick={onRemove} aria-label="ลบตัวกรอง" className="hover:text-red-500">
        <X size={10} />
      </button>
    </span>
  );
}
