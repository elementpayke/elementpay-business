"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, type Country } from "@/lib/countries";

type Variant = "full" | "dial";

interface CountrySelectProps {
  id?: string;
  value: string | null;
  onChange: (country: Country) => void;
  placeholder?: string;
  variant?: Variant;
  tone?: "default" | "soft";
  disabled?: boolean;
  ariaLabel?: string;
}

export default function CountrySelect({
  id,
  value,
  onChange,
  placeholder = "Select country",
  variant = "full",
  tone = "default",
  disabled = false,
  ariaLabel,
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => COUNTRIES.find((c) => c.code === value) ?? null,
    [value],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.includes(q.replace(/^\+/, "")),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const baseTriggerClass =
    tone === "soft"
      ? "border-0 bg-gray-100 dark:bg-gray-800/70"
      : "border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600";

  const triggerClass =
    variant === "dial"
      ? `flex h-12 w-full items-center justify-between rounded-xl px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/25 ${baseTriggerClass}`
      : `flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/25 ${baseTriggerClass}`;

  return (
    <div className="relative" ref={rootRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${triggerClass} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {selected ? (
            variant === "dial" ? (
              <>
                <span className="text-base leading-none">{selected.flag}</span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {selected.dialCode}
                </span>
              </>
            ) : (
              <>
                <span className="text-base leading-none">{selected.flag}</span>
                <span className="truncate text-gray-900 dark:text-white">
                  {selected.name}
                </span>
              </>
            )
          ) : (
            <span className="text-gray-400 dark:text-gray-500">
              {variant === "dial" ? "Country code" : placeholder}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 z-30 w-full min-w-[260px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
          style={{ top: "calc(100% + 6px)" }}
        >
          <div className="border-b border-gray-100 dark:border-gray-800 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">No countries found</li>
            ) : (
              results.map((c) => {
                const isSelected = selected?.code === c.code;
                return (
                  <li key={c.code} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        isSelected ? "bg-primary-50 dark:bg-primary-950/30" : ""
                      }`}
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="flex-1 truncate text-gray-900 dark:text-white">
                        {c.name}
                      </span>
                      <span className="text-xs text-gray-400">{c.dialCode}</span>
                      {isSelected ? (
                        <Check className="h-4 w-4 text-primary-500" />
                      ) : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
