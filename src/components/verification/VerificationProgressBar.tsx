"use client";

import { useEffect, useState } from "react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";

type VerificationProgressBarProps = {
  value: number;
  label: string;
  tone: "complete" | "brand" | "locked";
};

export default function VerificationProgressBar({
  value,
  label,
  tone,
}: VerificationProgressBarProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setAnimatedValue(value));
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[#8A90A5]">{label}</p>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
        aria-valuetext={label}
        className="h-1.5 overflow-hidden rounded-full bg-[#ECEFF7]"
      >
        <div
          className={mergeClasses(
            "h-full rounded-full transition-[width] duration-700 ease-out",
            tone === "complete" && "bg-gradient-to-r from-tertiary-600 via-tertiary-500 to-tertiary-300",
            tone === "brand" && "bg-gradient-to-r from-primary-500 via-primary-400 to-secondary-500",
            tone === "locked" && "bg-gradient-to-r from-[#D8DDE8] to-[#EDF1F7]",
          )}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
    </div>
  );
}
