"use client";

import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

export type FarmSelectOption = {
  value: string;
  label: string;
};

type FarmSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: FarmSelectOption[];
  placeholder?: string;
  className?: string;
  compact?: boolean;
};

export default function FarmSelect({
  value,
  onChange,
  options,
  placeholder = "เลือกข้อมูล",
  className = "",
  compact = false,
}: FarmSelectProps) {
  const selected = options.find((option) => option.value === value);

  return (
    <Listbox value={value} onChange={onChange}>
      <div className={`relative ${className}`}>
        <ListboxButton
          className={
            compact
              ? "w-full relative text-left border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-forest-400 pr-8"
              : "input-field relative text-left pr-11"
          }
        >
          <span className={selected ? "text-gray-800" : "text-gray-400"}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            size={compact ? 13 : 16}
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-gray-500 ${compact ? "right-2.5" : "right-4"}`}
          />
        </ListboxButton>

        <ListboxOptions className="absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
          {options.map((option) => (
            <ListboxOption
              key={option.value}
              value={option.value}
              className={({ focus, selected: isSelected }) =>
                [
                  "relative cursor-pointer select-none rounded-lg px-3 py-2.5 text-sm",
                  focus ? "bg-forest-50 text-forest-800" : "text-gray-700",
                  isSelected ? "bg-forest-100 font-semibold text-forest-800" : "",
                ].join(" ")
              }
            >
              {({ selected: isSelected }) => (
                <>
                  <span>{option.label}</span>
                  {isSelected && (
                    <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-700" />
                  )}
                </>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
