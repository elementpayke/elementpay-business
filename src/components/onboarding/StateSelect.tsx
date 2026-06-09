"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { State, type IState } from "country-state-city";

// Standardised state/region picker, mirroring CountrySelect's UX. The options
// are the ISO 3166-2 subdivisions for the given country (e.g. Kenya's 47
// counties, US states). We store the subdivision *name* — the backend `state`
// field and Noah both expect a human-readable region name, not the ISO code.
interface StateSelectProps {
  id?: string;
  countryCode: string | null;
  value: string;
  onChange: (stateName: string) => void;
  placeholder?: string;
  tone?: "default" | "soft";
  ariaLabel?: string;
}

export default function StateSelect({
  id,
  countryCode,
  value,
  onChange,
  placeholder = "Select state / region",
  tone = "default",
  ariaLabel,
}: StateSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const states = useMemo<IState[]>(
    () => (countryCode ? State.getStatesOfCountry(countryCode) : []),
    [countryCode],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return states;
    return states.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, states]);

  // Whether the selected value matches one of the country's known subdivisions.
  const isKnownValue = useMemo(
    () => states.some((s) => s.name === value),
    [states, value],
  );

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

  // Countries with no subdivision data in the dataset fall back to free text so
  // users are never blocked from entering an address.
  const hasOptions = states.length > 0;
  const disabled = !countryCode || !hasOptions;

  const baseTriggerClass =
    tone === "soft"
      ? "border-0 bg-gray-100 dark:bg-gray-800/70"
      : "border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600";

  if (disabled) {
    return (
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={!countryCode ? "Select a country first" : placeholder}
        aria-label={ariaLabel}
        className="w-full h-10 px-3 rounded-lg border-0 bg-gray-100 dark:bg-gray-800/70 text-gray-900 dark:text-white text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
      />
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/25 cursor-pointer ${baseTriggerClass}`}
      >
        <span className="flex min-w-0 flex-1 items-center text-left">
          {value ? (
            <span className="truncate text-gray-900 dark:text-white">
              {value}
              {!isKnownValue ? (
                <span className="ml-1 text-xs text-gray-400">(custom)</span>
              ) : null}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 z-30 w-full min-w-[240px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
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
                placeholder="Search state / region..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              />
            </div>
          </div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">No matches found</li>
            ) : (
              results.map((s) => {
                const isSelected = s.name === value;
                return (
                  <li key={s.isoCode} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(s.name);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        isSelected ? "bg-primary-50 dark:bg-primary-950/30" : ""
                      }`}
                    >
                      <span className="flex-1 truncate text-gray-900 dark:text-white">
                        {s.name}
                      </span>
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
