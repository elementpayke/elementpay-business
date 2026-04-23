"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Eraser, Terminal, X } from "lucide-react";
import { subscribeDevLog, type DevLogEntry, type DevLogLevel } from "@/lib/devlog";

const STORAGE_KEY = "elementpay.devlog.enabled";
const IDLE_COLLAPSE_MS = 4500;

const DOT_COLOR: Record<DevLogLevel, string> = {
  info: "bg-[#8A86DF]",
  success: "bg-[#39A88B]",
  warn: "bg-[#E89A1F]",
  error: "bg-[#E25555]",
};

function formatRelative(ts: number, now: number): string {
  const delta = Math.max(0, Math.round((now - ts) / 1000));
  if (delta < 1) return "now";
  if (delta < 60) return `${delta}s ago`;
  const m = Math.floor(delta / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export default function DevStatusBar() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return process.env.NODE_ENV !== "production";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? process.env.NODE_ENV !== "production" : stored === "1";
  });
  const [entries, setEntries] = useState<DevLogEntry[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persisted enable flag — default on in dev, off in prod unless user enables.
  useEffect(() => {
    if (!enabled) return;
    return subscribeDevLog((next) => setEntries(next));
  }, [enabled]);

  // Auto-collapse the expanded panel after idle.
  useEffect(() => {
    if (!expanded) return;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), IDLE_COLLAPSE_MS);
    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
    };
  }, [expanded, entries]);

  // Tick clock so "Xs ago" stays fresh while panel is open.
  useEffect(() => {
    if (!expanded) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expanded]);

  // Keyboard shortcut: Cmd/Ctrl+` toggles enable.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "`") {
        e.preventDefault();
        setEnabled((prev) => {
          const next = !prev;
          localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!enabled) return null;

  const latest = entries[entries.length - 1];

  return (
    <div className="pointer-events-none fixed bottom-3 left-3 z-50 max-w-[min(92vw,420px)] font-sans">
      <div
        className={`pointer-events-auto overflow-hidden rounded-lg border border-[#E1E4EE] bg-white/95 text-[12px] text-[#3F465E] shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur transition-all`}
      >
        {/* Footer bar (always visible) */}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition hover:bg-[#F6F7FB]"
        >
          <Terminal className="h-3.5 w-3.5 shrink-0 text-[#7E8498]" />
          {latest ? (
            <>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLOR[latest.level]}`} />
              <span className="truncate font-mono text-[11px] text-[#5F667D]">
                <span className="text-[#9298AC]">[{latest.scope}]</span> {latest.message}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-[#9298AC]">Idle — waiting for activity…</span>
          )}
          <span className="ml-auto text-[#9298AC]">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </span>
        </button>

        {/* Expanded log history */}
        {expanded ? (
          <div className="border-t border-[#ECEEF5] bg-white">
            <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] uppercase tracking-[0.08em] text-[#9298AC]">
              <span>Activity log · {entries.length}</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Clear log"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEntries([]);
                  }}
                  className="rounded p-1 text-[#9298AC] transition hover:bg-[#F4F5F9] hover:text-[#3F465E]"
                >
                  <Eraser className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  aria-label="Hide status bar"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEnabled(false);
                    localStorage.setItem(STORAGE_KEY, "0");
                  }}
                  className="rounded p-1 text-[#9298AC] transition hover:bg-[#F4F5F9] hover:text-[#3F465E]"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
            <ul className="max-h-56 overflow-y-auto px-2.5 pb-2">
              {entries.length === 0 ? (
                <li className="py-2 text-center text-[11px] text-[#9298AC]">No events yet</li>
              ) : (
                entries
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-2 border-t border-[#F4F5F9] py-1.5 first:border-t-0"
                    >
                      <span
                        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${DOT_COLOR[entry.level]}`}
                      />
                      <div className="min-w-0 flex-1 font-mono text-[11px] leading-tight">
                        <span className="text-[#9298AC]">[{entry.scope}]</span>{" "}
                        <span className="text-[#3F465E]">{entry.message}</span>
                      </div>
                      <span className="shrink-0 text-[10px] text-[#B0B5C7]">
                        {formatRelative(entry.ts, now)}
                      </span>
                    </li>
                  ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
