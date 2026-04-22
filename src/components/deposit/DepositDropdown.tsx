"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

type DepositDropdownProps<T> = {
  label: string;
  placeholder: string;
  selected: T | null;
  options: T[];
  onSelect: (option: T) => void;
  renderTriggerValue: (option: T) => React.ReactNode;
  renderOption: (option: T, isSelected: boolean) => React.ReactNode;
  getOptionKey: (option: T) => string;
  disabled?: boolean;
};

export default function DepositDropdown<T>({
  label,
  placeholder,
  selected,
  options,
  onSelect,
  renderTriggerValue,
  renderOption,
  getOptionKey,
  disabled = false,
}: DepositDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <label className="block text-sm font-medium text-[#4D556D]">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className={`flex h-12 w-full items-center justify-between rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm transition ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-[#D9DEEC]"
          }`}
        >
          <span className="flex min-w-0 flex-1 items-center text-left">
            {selected ? (
              renderTriggerValue(selected)
            ) : (
              <span className="text-[#8E93A7]">{placeholder}</span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-[#7E8498] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div className="absolute left-0 z-20 w-full rounded-xl border border-[#E8EBF3] bg-white shadow-xl" style={{ top: "calc(100% + 6px)" }}>
            <div className="max-h-72 overflow-y-auto py-1">
              {options.map((opt) => {
                const isSelected =
                  selected !== null && getOptionKey(opt) === getOptionKey(selected);
                return (
                  <button
                    type="button"
                    key={getOptionKey(opt)}
                    onClick={() => {
                      onSelect(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center px-4 py-3 text-left transition hover:bg-[#F7F8FD] ${
                      isSelected ? "bg-primary-100/50" : ""
                    }`}
                  >
                    {renderOption(opt, isSelected)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
