"use client";

import Flag from "@/components/dashboard/Flag";
import { useCurrency } from "@/lib/currency/CurrencyContext";

// Mirrors exactly what Flag.tsx exports — no import needed
type FlagCode = "KE" | "NG" | "GH" | "US";

type RateBadge = {
  code: FlagCode;
  currency: string;
  rate: number;
};

// Only codes that Flag.tsx renders — add more when Flag.tsx gains more flags
const RATE_BADGES: RateBadge[] = [
  { code: "KE", currency: "KES", rate: 129.0 },
  { code: "NG", currency: "NGN", rate: 1422.73 },
  { code: "GH", currency: "GHS", rate: 10.775 },
  { code: "US", currency: "USD", rate: 1.0 },
];

function relativeTime(dateString: string | null) {
  if (!dateString) return "Syncing…";
  const diffMs = Date.now() - new Date(dateString).getTime();
  const secs = Math.max(0, Math.floor(diffMs / 1000));
  if (secs < 60) return "Updated just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `Updated ${mins}m ago`;
  return `Updated ${Math.floor(mins / 60)}h ago`;
}

export default function ExchangeRatesCarousel() {
  const { lastUpdated } = useCurrency();
  const doubled = [...RATE_BADGES, ...RATE_BADGES];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-foreground">Exchange Rates</p>
        <p className="text-[10px] text-foreground-muted">{relativeTime(lastUpdated)}</p>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex w-max"
          style={{ animation: "marquee-scroll 20s linear infinite" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.animationPlayState = "paused")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.animationPlayState = "running")
          }
        >
          {doubled.map((r, i) => (
            <span
              key={`${r.currency}-${i}`}
              className="mr-2 inline-flex items-center gap-1.5 rounded-full border
                         border-border bg-surface px-2.5 py-1 text-[11px]
                         text-foreground whitespace-nowrap"
            >
              <Flag code={r.code} size={13} />
              <span className="font-medium">1 USD</span>
              <span className="text-foreground-muted">=</span>
              <span className="font-semibold">
                {r.rate.toLocaleString(undefined, { maximumFractionDigits: 3 })}{" "}
                {r.currency}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}