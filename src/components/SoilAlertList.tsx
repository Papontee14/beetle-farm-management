"use client";

import { useState } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { BeetleSummary } from "@/types";

interface SoilAlertListProps {
  items: BeetleSummary[];
  compact?: boolean;
  onDone?: () => void;
}

export default function SoilAlertList({ items, compact = false, onDone }: SoilAlertListProps) {
  const [busy, setBusy] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="card text-center py-6 text-sm text-gray-400">
        ✅ ไม่มีกล่องที่ต้องเปลี่ยนแมทวันนี้
      </div>
    );
  }

  async function handleDone(id: string, containerCode: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/soil-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beetleId: id, daysUntilNext: 30 }),
      });
      if (res.ok) {
        toast.success(`เปลี่ยนแมท ${containerCode} เรียบร้อย`);
        onDone?.();
      } else {
        toast.error("เกิดข้อผิดพลาด");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b._id} className="card flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              📦 {b.containerCode} — {b.beetleId}
            </p>
            {!compact && (
              <p className="text-xs text-gray-500 mt-0.5">
                {b.species} · {b.stage}
                {b.nextSoilChange && (
                  <>
                    {" · "}
                    <span className="text-red-500 font-medium">
                      ครบกำหนด{" "}
                      {format(new Date(b.nextSoilChange), "d MMM yy", { locale: th })}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
          {!compact && onDone && (
            <button
              onClick={() => handleDone(b._id, b.containerCode)}
              disabled={busy === b._id}
              className="shrink-0 btn-primary !py-2 !px-3 text-xs"
              aria-label="บันทึกเปลี่ยนแมท"
            >
              {busy === b._id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              เปลี่ยนแมท
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
