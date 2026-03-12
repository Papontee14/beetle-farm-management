"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Leaf } from "lucide-react";
import { BeetleSummary } from "@/types";
import SoilAlertList from "@/components/SoilAlertList";

export default function SoilAlertsPage() {
  const [items, setItems]     = useState<BeetleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/soil-alerts")
      .then((r) => r.json())
      .then((res) => { if (res.success) setItems(res.data); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pt-2">
        <Leaf size={22} className="text-soil-600" />
        <h1 className="text-xl font-bold text-forest-800">เปลี่ยนแมท (ถึงกำหนด)</h1>
        {items.length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-forest-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-10 text-sm text-gray-400">
          <AlertTriangle className="mx-auto mb-2 text-gray-300" size={28} />
          ไม่มีกล่องที่ถึงกำหนดเปลี่ยนแมทในขณะนี้
        </div>
      ) : (
        <SoilAlertList items={items} onDone={load} />
      )}
    </div>
  );
}
