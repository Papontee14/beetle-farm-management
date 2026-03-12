"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { BeetleSummary, BeetleStage, BeetleStatus } from "@/types";
import BeetleCard from "@/components/BeetleCard";

const STAGES: BeetleStage[] = ["Egg", "L1", "L2", "L3", "Pupa", "Adult"];
const STATUSES: BeetleStatus[] = ["Healthy", "Sick", "Dead", "Sold"];

export default function BeetlesPage() {
  const [beetles, setBeetles] = useState<BeetleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [stage, setStage]     = useState("");
  const [status, setStatus]   = useState("");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (stage)  params.set("stage",  stage);
    if (status) params.set("status", status);

    fetch(`/api/beetles?${params}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setBeetles(res.data); })
      .finally(() => setLoading(false));
  }, [search, stage, status]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-forest-800">รายการด้วง</h1>
        <Link href="/beetles/new" className="btn-primary !py-2 !px-4 text-sm">
          + เพิ่ม
        </Link>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9 pr-10"
          placeholder="ค้นหา ID, ชื่อ, สายพันธุ์, กล่อง…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Filter dropdowns */}
      {showFilter && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">ระยะการเจริญ</label>
            <select className="input-field" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">สถานะ</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">ทั้งหมด</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : beetles.length === 0 ? (
        <div className="card text-center py-10 text-gray-400 text-sm">
          ไม่พบข้อมูลด้วง
        </div>
      ) : (
        <ul className="space-y-2">
          {beetles.map((b) => (
            <li key={b._id}>
              <BeetleCard beetle={b} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
