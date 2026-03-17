"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { BeetleSummary } from "@/types";

interface BeetleSearchInputProps {
  label: string;
  value: string;
  onChange: (beetleId: string) => void;
  excludeId?: string; // _id ของด้วงปัจจุบัน (ป้องกันเลือกตัวเอง)
}

export default function BeetleSearchInput({
  label,
  value,
  onChange,
  excludeId,
}: BeetleSearchInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<BeetleSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // sync display when value changes externally
  useEffect(() => { setQuery(value); }, [value]);

  // debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/beetles?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          const filtered = (data.data as BeetleSummary[])
            .filter((b) => !excludeId || b._id !== excludeId)
            .slice(0, 8);
          setResults(filtered);
          setOpen(filtered.length > 0);
        }
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [query, excludeId]);

  // close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function select(b: BeetleSummary) {
    onChange(b.beetleId);
    setQuery(b.beetleId);
    setOpen(false);
  }

  function clear() {
    onChange("");
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="label">{label}</label>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          className="input-field pl-8 pr-8"
          placeholder="ค้นหา ID, สายพันธุ์…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {query && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="ล้าง"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {loading && <p className="text-xs text-gray-400 mt-1">กำลังค้นหา…</p>}
      {open && results.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto text-sm">
          {results.map((b) => (
            <li key={b._id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(b); }}
                className="w-full text-left px-3 py-2 hover:bg-forest-50 flex items-center gap-2"
              >
                <span className="font-bold text-forest-700">{b.beetleId}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">{b.stage} · {b.species}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
