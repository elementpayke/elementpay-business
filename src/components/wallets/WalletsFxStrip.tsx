"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import { useCurrency } from "@/lib/currency/CurrencyContext";

type RateEntry = {
  fromCode: "US";
  toCode: "KE" | "NG" | "GH";
  toLabel: string;
  rateKey?: "usdKes";
  fallback: string;
  tone: "green" | "blue";
};

const RATE_ENTRIES: RateEntry[] = [
  {
    fromCode: "US",
    toCode: "KE",
    toLabel: "Kenyan Shillings",
    rateKey: "usdKes",
    fallback: "129.00",
    tone: "green",
  },
  {
    fromCode: "US",
    toCode: "NG",
    toLabel: "Nigerian Naira",
    fallback: "1,422.73",
    tone: "green",
  },
  {
    fromCode: "US",
    toCode: "GH",
    toLabel: "Ghanaian Cedis",
    fallback: "10.77508",
    tone: "blue",
  },
];

function relativeMinutes(dateString: string | null) {
  if (!dateString) return "refreshing";

  const minutes = Math.max(
    0,
    Math.floor(
      (Date.now() - new Date(dateString).getTime()) /
        60_000,
    ),
  );

  return minutes === 0
    ? "just now"
    : `${minutes} min${minutes === 1 ? "" : "s"} ago`;
}

function formatRate(
  value: number | undefined,
  fallback: string,
): string {
  if (!value) return fallback;

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 5,
    minimumFractionDigits: 2,
  });
}

export default function WalletsFxStrip() {
  const {
    lastUpdated,
    selectedCurrency,
    usdKesRate,
  } = useCurrency() as {
    lastUpdated: string | null;
    selectedCurrency: string;
    usdKesRate: number;
    [key: string]: unknown;
  };

  const scrollRef =
    useRef<HTMLDivElement>(null);

  const dateLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )
    : "Live";

  function scrollBy(
    direction: "left" | "right",
  ) {
    scrollRef.current?.scrollBy({
      left:
        direction === "left"
          ? -220
          : 220,
      behavior: "smooth",
    });
  }

  const rateValues: Record<
    string,
    number | undefined
  > = {
    usdKes: usdKesRate,
  };

  return (
    <section className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">
            {dateLabel} FX Rates
          </p>

          <p className="mt-0.5 text-[11px] text-foreground-muted">
            Last updated:{" "}
            {relativeMinutes(lastUpdated)} ·
            Display currency:{" "}
            {selectedCurrency}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {(["left", "right"] as const).map(
            (dir) => (
              <button
                key={dir}
                type="button"
                aria-label={`Scroll rates ${dir}`}
                onClick={() =>
                  scrollBy(dir)
                }
                className="
                  flex h-7 w-7 items-center justify-center rounded-lg border transition
                  border-border bg-surface text-foreground-muted
                  hover:border-primary-200 hover:text-primary-600
                "
              >
                {dir === "left" ? (
                  <ChevronLeft className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ),
          )}
        </div>
      </div>

      {/* FX Cards */}
      <div
        ref={scrollRef}
        className="
          flex items-center gap-2 overflow-x-auto pb-1
        "
        style={
          {
            scrollbarWidth: "none",
            msOverflowStyle:
              "none",
          } as React.CSSProperties
        }
      >
        {RATE_ENTRIES.map((entry) => {
          const live = entry.rateKey
            ? rateValues[
                entry.rateKey
              ]
            : undefined;

          const display =
            formatRate(
              live,
              entry.fallback,
            );

          const toneClass =
            entry.tone === "green"
              ? "text-[#1E9F72]"
              : "text-primary-600";

          return (
            <div
              key={entry.toCode}
              className="
                inline-flex shrink-0 items-center gap-2 rounded-full border
                px-3 py-1.5 text-xs transition
                border-border bg-surface
              "
            >
              {/* Flags */}
              <span className="relative inline-flex h-4 w-5 shrink-0">
                <Flag
                  code={
                    entry.fromCode
                  }
                  size={16}
                />

                <span className="absolute -bottom-0.5 -right-1.5">
                  <Flag
                    code={
                      entry.toCode
                    }
                    size={12}
                  />
                </span>
              </span>

              <span
                className={`whitespace-nowrap font-medium ${toneClass}`}
              >
                1 US Dollar ={" "}
                {display}{" "}
                {entry.toLabel}
              </span>

              {live ? (
                <RefreshCw className="h-2.5 w-2.5 shrink-0 text-foreground-muted" />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}