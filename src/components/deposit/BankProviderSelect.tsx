"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { CatalogProvider } from "@/lib/catalog/api";

type BankProviderSelectProps = {
  providers: CatalogProvider[];
  /** Selected provider `code` (what we store as bankCode). */
  value: string;
  onChange: (code: string) => void;
};

/**
 * Searchable dropdown for picking a bank from the catalog. Some corridors
 * carry dozens of banks (NG, ZA, GH), so this filters as you type and stores
 * the provider `code` as the bank code the backend expects.
 */
export default function BankProviderSelect({
  providers,
  value,
  onChange,
}: BankProviderSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => providers.find((p) => p.code === value) ?? null,
    [providers, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
    );
  }, [providers, query]);

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
      <label className="block text-xs font-medium text-[#4D556D]">Bank</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-sm transition hover:border-[#D9DEEC]"
        >
          <span className="truncate text-left">
            {selected ? (
              <span className="font-medium text-[#1F2640]">{selected.name}</span>
            ) : (
              <span className="text-[#8E93A7]">Select your bank</span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[#7E8498] transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open ? (
          <div
            className="absolute left-0 z-20 w-full rounded-xl border border-[#E8EBF3] bg-white shadow-xl"
            style={{ top: "calc(100% + 6px)" }}
          >
            <div className="flex items-center gap-2 border-b border-[#EFF1F7] px-3 py-2">
              <Search className="h-4 w-4 text-[#9CA3B6]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search banks…"
                className="w-full bg-transparent text-sm text-[#1F2640] outline-none placeholder:text-[#B0B7CE]"
              />
            </div>
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[#8E93A7]">No matches.</p>
              ) : (
                filtered.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => {
                      onChange(p.code);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition hover:bg-[#F7F8FD] ${
                      p.code === value ? "bg-primary-100/50" : ""
                    }`}
                  >
                    <span className="truncate text-sm font-medium text-[#1F2640]">
                      {p.name}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
