"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { BeetleSummary, BeetleStage, BeetleStatus, BeetleSex } from "@/types";
import BeetleCard from "@/components/BeetleCard";

const STAGES: BeetleStage[] = ["Egg", "L1", "L2", "L3", "Pupa", "Adult"];
const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];
const SEXES: BeetleSex[] = ["Male", "Female", "Unknown"];

type FilterMode = "" | "basic" | "advanced";

function BeetlesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [beetles, setBeetles] = useState<BeetleSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [speciesList, setSpeciesList] = useState<string[]>([]);

  // Basic filters — init from URL
  const [search,  setSearch]  = useState(searchParams.get("search")  ?? "");
  const [stage,   setStage]   = useState(searchParams.get("stage")   ?? "");
  const [status,  setStatus]  = useState(searchParams.get("status")  ?? "");
  const [species, setSpecies] = useState(searchParams.get("species") ?? "");

  // Advanced filters — init from URL
  const [sex,           setSex]          = useState(searchParams.get("sex")           ?? "");
  const [containerCode, setContainerCode]= useState(searchParams.get("containerCode") ?? "");
  const [weightMin,     setWeightMin]    = useState(searchParams.get("weightMin")     ?? "");
  const [weightMax,     setWeightMax]    = useState(searchParams.get("weightMax")     ?? "");
  const [soilWithin,    setSoilWithin]   = useState(searchParams.get("soilWithin")    ?? "");
  const [fatherId,      setFatherId]     = useState(searchParams.get("fatherId")      ?? "");
  const [motherId,      setMotherId]     = useState(searchParams.get("motherId")      ?? "");

  // Determine initial filterMode from URL
  const [filterMode, setFilterMode] = useState<FilterMode>(() => {
    const p = searchParams;
    if (p.get("sex") || p.get("fatherId") || p.get("motherId") ||
        p.get("containerCode") || p.get("weightMin") || p.get("weightMax") || p.get("soilWithin"))
      return "advanced";
    if (p.get("stage") || p.get("status") || p.get("species"))
      return "basic";
    return "";
  });

  const hasFilters = !!(search || stage || status || species || sex || containerCode || weightMin || weightMax || soilWithin || fatherId || motherId);

  function clearFilters() {
    setSearch(""); setStage(""); setStatus(""); setSpecies("");
    setSex(""); setContainerCode(""); setWeightMin(""); setWeightMax(""); setSoilWithin("");
    setFatherId(""); setMotherId("");
  }

  // Sync filter state to URL (skip first render to avoid no-op navigation on mount)
  const skipFirstSync = useRef(true);
  useEffect(() => {
    if (skipFirstSync.current) { skipFirstSync.current = false; return; }
    const p = new URLSearchParams();
    if (search)        p.set("search",       search);
    if (stage)         p.set("stage",        stage);
    if (status)        p.set("status",       status);
    if (species)       p.set("species",      species);
    if (sex)           p.set("sex",          sex);
    if (containerCode) p.set("containerCode",containerCode);
    if (weightMin)     p.set("weightMin",    weightMin);
    if (weightMax)     p.set("weightMax",    weightMax);
    if (soilWithin)    p.set("soilWithin",   soilWithin);
    if (fatherId)      p.set("fatherId",     fatherId);
    if (motherId)      p.set("motherId",     motherId);
    router.replace(`/beetles${p.toString() ? `?${p}` : ""}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, stage, status, species, sex, containerCode, weightMin, weightMax, soilWithin, fatherId, motherId]);

  // Fetch unique species for dropdown (once on mount)
  useEffect(() => {
    fetch("/api/beetles")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const unique = [...new Set<string>((res.data as BeetleSummary[]).map((b) => b.species))].sort();
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
    if (soilWithin)    params.set("soilWithinDays",soilWithin);
    if (fatherId)      params.set("fatherId",      fatherId);
    if (motherId)      params.set("motherId",      motherId);

    fetch(`/api/beetles?${params}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setBeetles(res.data); })
      .finally(() => setLoading(false));
  }, [search, stage, status, species, sex, containerCode, weightMin, weightMax, soilWithin, fatherId, motherId]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-forest-800">
          รายการด้วง
          {!loading && (
            <span className="ml-2 text-sm font-normal text-gray-400">({beetles.length} รายการ)</span>
          )}
        </h1>
        <Link href="/beetles/new" className="btn-primary !py-2 !px-4 text-sm">+ เพิ่ม</Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9 pr-24"
          placeholder="ค้นหา ID, ชื่อ, สายพันธุ์, กล่อง…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <button
            onClick={() => setFilterMode(filterMode === "basic" ? "" : "basic")}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors
              ${filterMode === "basic"
                ? "bg-forest-600 text-white border-forest-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-forest-400"}`}
          >
            <SlidersHorizontal size={12} /> ตัวกรอง
          </button>
          <button
            onClick={() => setFilterMode(filterMode === "advanced" ? "" : "advanced")}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors
              ${filterMode === "advanced"
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-violet-400"}`}
          >
            <ChevronDown size={12} /> แบบละเอียด
          </button>
        </div>
      </div>

      {/* Basic filter panel */}
      {(filterMode === "basic" || filterMode === "advanced") && (
        <div className="card space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">ตัวกรองพื้นฐาน</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">ระยะการเจริญ</label>
              <select className="input-field" value={stage} onChange={(e) => setStage(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">สถานะสุขภาพ</label>
              <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">สายพันธุ์</label>
              <select className="input-field" value={species} onChange={(e) => setSpecies(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {speciesList.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Advanced filter panel */}
      {filterMode === "advanced" && (
        <div className="card space-y-3 border-violet-200 bg-violet-50/30">
          <p className="text-xs font-bold text-violet-600 uppercase tracking-wide">ตัวกรองขั้นสูง</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="label">เพศ</label>
              <select className="input-field" value={sex} onChange={(e) => setSex(e.target.value)}>
                <option value="">ทั้งหมด</option>
                {SEXES.map((s) => <option key={s}>{s}</option>)}
              </select>
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
            <div className="col-span-2">
              <label className="label">ถึงกำหนดเปลี่ยนแมทภายใน (N วัน)</label>
              <div className="flex gap-2">
                {["", "7", "14", "30", "60"].map((d) => (
                  <button key={d} type="button" onClick={() => setSoilWithin(d)}
                    className={`flex-1 text-xs py-2 rounded-xl border font-medium transition-colors
                      ${soilWithin === d
                        ? "bg-forest-600 text-white border-forest-600"
                        : "bg-white text-gray-600 border-gray-200 hover:border-forest-400"}`}>
                    {d === "" ? "ทั้งหมด" : `≤ ${d} วัน`}
                  </button>
                ))}
              </div>
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
        </div>
      )}

      {/* Active filter tags */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">ตัวกรองที่ใช้อยู่:</span>
          {search        && <Tag label={`ค้นหา: ${search}`}          onRemove={() => setSearch("")} />}
          {stage         && <Tag label={`ระยะ: ${stage}`}            onRemove={() => setStage("")} />}
          {status        && <Tag label={`สถานะ: ${status}`}          onRemove={() => setStatus("")} />}
          {species       && <Tag label={`พันธุ์: ${species}`}        onRemove={() => setSpecies("")} />}
          {sex           && <Tag label={`เพศ: ${sex}`}               onRemove={() => setSex("")} />}
          {containerCode && <Tag label={`กล่อง: ${containerCode}`}   onRemove={() => setContainerCode("")} />}
          {weightMin     && <Tag label={`≥ ${weightMin} g`}          onRemove={() => setWeightMin("")} />}
          {weightMax     && <Tag label={`≤ ${weightMax} g`}          onRemove={() => setWeightMax("")} />}
          {soilWithin    && <Tag label={`แมท ≤ ${soilWithin} วัน`}  onRemove={() => setSoilWithin("")} />}
          {fatherId      && <Tag label={`พ่อ: ${fatherId}`}          onRemove={() => setFatherId("")} />}
          {motherId      && <Tag label={`แม่: ${motherId}`}          onRemove={() => setMotherId("")} />}
          <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 ml-auto">
            ล้างทั้งหมด
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : beetles.length === 0 ? (
        <div className="card text-center py-10 text-gray-400 text-sm">ไม่พบข้อมูลด้วง</div>
      ) : (
        <ul className="space-y-2">
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
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BeetlesContent />
    </Suspense>
  );
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 bg-forest-100 text-forest-700 text-xs font-medium px-2 py-0.5 rounded-full">
      {label}
      <button onClick={onRemove} aria-label="ลบตัวกรอง"><X size={10} /></button>
    </span>
  );
}
