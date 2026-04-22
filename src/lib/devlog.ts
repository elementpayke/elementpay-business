/**
 * Tiny event bus that powers the dev status bar (bottom-left).
 *
 * Browser-only. Components push entries via `devLog.info(...)` etc., the
 * `<DevStatusBar />` subscribes to render the latest few. The bus is
 * intentionally framework-free so non-React modules (hooks, fetchers) can
 * push without dragging context around.
 */

export type DevLogLevel = "info" | "success" | "warn" | "error";

export type DevLogEntry = {
  id: number;
  ts: number;
  level: DevLogLevel;
  scope: string;
  message: string;
};

const MAX_ENTRIES = 50;

let nextId = 1;
const entries: DevLogEntry[] = [];
const listeners = new Set<(entries: DevLogEntry[]) => void>();

function push(level: DevLogLevel, scope: string, message: string) {
  if (typeof window === "undefined") return;
  const entry: DevLogEntry = {
    id: nextId++,
    ts: Date.now(),
    level,
    scope,
    message,
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  listeners.forEach((l) => l(entries.slice()));
}

export const devLog = {
  info: (scope: string, message: string) => push("info", scope, message),
  success: (scope: string, message: string) => push("success", scope, message),
  warn: (scope: string, message: string) => push("warn", scope, message),
  error: (scope: string, message: string) => push("error", scope, message),
};

export function subscribeDevLog(listener: (entries: DevLogEntry[]) => void) {
  listeners.add(listener);
  listener(entries.slice());
  return () => {
    listeners.delete(listener);
  };
}
