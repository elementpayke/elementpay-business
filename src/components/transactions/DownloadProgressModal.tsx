"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface DownloadProgressModalProps {
  onClose: () => void;
}

export default function DownloadProgressModal({ onClose }: DownloadProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const steps: Array<{ target: number; delay: number }> = [
      { target: 35, delay: 300 },
      { target: 62, delay: 800 },
      { target: 84, delay: 1400 },
      { target: 100, delay: 2100 },
    ];
    const timers = steps.map(({ target, delay }) =>
      setTimeout(() => {
        setProgress(target);
        if (target === 100) setTimeout(() => setDone(true), 400);
      }, delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 w-full rounded-t-2xl border border-[#ECEEF5] bg-white px-6 py-8 shadow-[0_-8px_40px_rgba(16,24,40,0.12)] sm:max-w-[400px] sm:rounded-2xl sm:shadow-[0_32px_80px_rgba(16,24,40,0.18)] dark:border-[#252840] dark:bg-[#13162A]">
        {/* Mobile drag handle */}
        <div className="absolute left-1/2 top-3 -translate-x-1/2 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#E0E3EE] dark:bg-[#2A3050]" />
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-[#8D92A6] transition hover:bg-[#F5F6FA] dark:hover:bg-[#1F2235]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B8A] to-[#E83D5F] shadow-[0_8px_24px_rgba(232,61,95,0.3)]">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
              <rect x="8" y="4" width="22" height="28" rx="3" fill="white" fillOpacity="0.9" />
              <rect x="13" y="11" width="12" height="1.5" rx="0.75" fill="white" fillOpacity="0.5" />
              <rect x="13" y="15" width="9" height="1.5" rx="0.75" fill="white" fillOpacity="0.5" />
              <rect x="13" y="19" width="11" height="1.5" rx="0.75" fill="white" fillOpacity="0.5" />
              <circle cx="27" cy="30" r="10" fill="#FF4D6D" />
              <path d="M27 25v8M23 29l4 4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h3 className="text-base font-semibold text-[#171D32] dark:text-[#E8ECF8]">
            {done ? "CSV Ready!" : "Downloading CSV Report..."}
          </h3>
          <p className="mt-1.5 text-xs text-[#8D92A6] dark:text-[#6B7290]">
            {done
              ? "Your CSV file has been downloaded successfully."
              : "Your CSV export is in progress. This shouldn't take long."}
          </p>

          {/* Progress bar */}
          <div className="mt-5 w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EDF0F7] dark:bg-[#1F2235]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#9298AC] dark:text-[#5A6080]">
              <span>{progress}%</span>
              <span>{done ? "Complete" : "In progress..."}</span>
            </div>
          </div>

          <div className="mt-5">
            {done ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-primary-500 px-6 py-2 text-xs font-semibold text-white transition hover:brightness-105"
              >
                Done
              </button>
            ) : (
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                Go to Transactions
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
