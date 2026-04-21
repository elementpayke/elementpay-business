"use client";

import { CheckCircle2 } from "lucide-react";

export default function CopyToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#DDE1EE] bg-white px-4 py-2.5 text-sm font-medium text-[#1F2640] shadow-[0_12px_32px_rgba(16,24,40,0.12)] transition ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <span className="inline-flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-tertiary-500" />
        {message}
      </span>
    </div>
  );
}
