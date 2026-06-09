"use client";

import Flag from "@/components/dashboard/Flag";
import Skeleton from "@/components/dashboard/Skeleton";
import { useExchangeRates } from "@/lib/dashboard/hooks";
import type { FlagCode } from "@/components/dashboard/Flag";

const CURRENCY_META: Record<
  string,
  { flag: FlagCode; label: string; decimals: number }
> = {
  KES: { flag: "KE", label: "Kenyan Shillings", decimals: 2 },
  NGN: { flag: "NG", label: "Nigerian Naira", decimals: 2 },
  GHS: { flag: "GH", label: "Ghanaian Cedis", decimals: 6 },
  UGX: { flag: "UG", label: "Ugandan Shillings", decimals: 2 },
  TZS: { flag: "TZ", label: "Tanzanian Shillings", decimals: 2 },
};

function formatRate(value: number, decimals: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  }).format(value);
}

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ExchangeRateTicker() {
  const { data, isLoading, isError, dataUpdatedAt } = useExchangeRates();

  return (
    <section className="space-y-3">
      <div className="text-xs">
        <p className="font-medium text-foreground">
          {todayLabel()} Exchange Rates:
        </p>
        <p className="mt-0.5 text-foreground-muted">
          {isLoading
            ? "Loading rates…"
            : isError
              ? "Rates unavailable"
              : dataUpdatedAt
                ? `Last updated: ${new Date(dataUpdatedAt).toLocaleTimeString()}`
                : "—"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-56" rounded="full" />
            ))
          : data
            ? Object.entries(data.rates).map(([code, rate]) => {
                const meta = CURRENCY_META[code];
                if (!meta) return null;
                return (
                  <div
                    key={code}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                  >
                    <Flag code={meta.flag} size={16} />
                    <span className="whitespace-nowrap">
                      1 {data.base} = {formatRate(rate, meta.decimals)} {meta.label}
                    </span>
                  </div>
                );
              })
            : null}
      </div>
    </section>
  );
}
