"use client";

import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Calendar, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import "react-day-picker/dist/style.css";

type FarmDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function FarmDatePicker({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  className = "",
}: FarmDatePickerProps) {
  const selectedDate = (() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  })();

  return (
    <Popover className={`relative ${className}`}>
      {({ close }) => (
        <>
          <PopoverButton className="input-field flex items-center justify-between gap-3 text-left">
            <span className={selectedDate ? "text-gray-800" : "text-gray-400"}>
              {selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
            </span>
            <Calendar size={16} className="shrink-0 text-gray-500" />
          </PopoverButton>

          <PopoverPanel className="absolute left-0 top-full z-40 mt-2 w-[min(340px,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                เลือกวันที่
              </p>
              {value ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                  onClick={() => onChange("")}
                >
                  <X size={12} /> ล้าง
                </button>
              ) : (
                <span className="text-xs text-gray-300">&nbsp;</span>
              )}
            </div>

            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) return;
                onChange(format(date, "yyyy-MM-dd"));
                close();
              }}
              showOutsideDays
              fixedWeeks
              className="w-full"
              classNames={{
                months: "w-full",
                month: "w-full",
                caption: "mb-3 flex items-center justify-between",
                caption_label: "text-sm font-semibold text-gray-700",
                nav: "flex items-center gap-1",
                button_previous:
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100",
                button_next:
                  "inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100",
                month_grid: "w-full border-collapse",
                weekdays: "grid grid-cols-7",
                weekday: "py-1.5 text-center text-xs font-semibold text-gray-400",
                week: "grid grid-cols-7",
                day: "flex items-center justify-center",
                day_button: "h-9 w-9 rounded-md text-sm text-gray-700 hover:bg-forest-50",
                day_today: "font-bold text-forest-700",
                day_selected: "bg-forest-600 text-white hover:bg-forest-700",
                day_outside: "text-gray-300",
              }}
            />
          </PopoverPanel>
        </>
      )}
    </Popover>
  );
}
