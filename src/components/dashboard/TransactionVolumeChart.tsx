"use client";

import { ArrowDownLeft, ArrowUpRight, BarChart3, Coins } from "lucide-react";
import EmptyState from "@/components/dashboard/EmptyState";
import Skeleton from "@/components/dashboard/Skeleton";
import {
  DropdownTrigger,
  cardClassName,
} from "@/components/dashboard/DashboardPrimitives";
import {
  useDashboardSummary,
  useExchangeRates,
} from "@/lib/dashboard/hooks";

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function VolumeSummary({
  moneyIn,
  moneyOut,
  pending,
}: {
  moneyIn: number;
  moneyOut: number;
  pending: number;
}) {
  const total = moneyIn + moneyOut;
  const inPct = total > 0 ? (moneyIn / total) * 100 : 0;
  const outPct = total > 0 ? (moneyOut / total) * 100 : 0;

  return (
    <div className="mt-6 space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryTile
          label="Money in (30 days)"
          value={formatUsd(moneyIn)}
          tone="in"
        />
        <SummaryTile
          label="Money out (30 days)"
          value={formatUsd(moneyOut)}
          tone="out"
        />
        <SummaryTile
          label="Pending"
          value={pending.toLocaleString()}
          tone="neutral"
        />
      </div>

      {total > 0 ? (
        <div className="space-y-2">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="bg-primary-500 transition-[width] duration-500 ease-out"
              style={{ width: `${inPct}%` }}
            />
            <div
              className="bg-secondary-500 transition-[width] duration-500 ease-out"
              style={{ width: `${outPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-foreground-muted">
            <span>{inPct.toFixed(0)}% in</span>
            <span>{outPct.toFixed(0)}% out</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-foreground-muted">
          No completed transactions in the last 30 days.
        </p>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "in" | "out" | "neutral";
}) {
  const Icon =
    tone === "in" ? ArrowDownLeft : tone === "out" ? ArrowUpRight : Coins;
  const accent =
    tone === "in"
      ? "bg-primary-100 text-primary-600"
      : tone === "out"
        ? "bg-secondary-100 text-secondary-600"
        : "bg-tertiary-100 text-tertiary-600";

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${accent}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
          {label}
        </p>
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function TransactionVolumeChart() {
  const summary = useDashboardSummary();
  // Pre-fetched here so the WalletSummary card and ticker share cache.
  useExchangeRates();

  const totals = summary.data?.totals;
  const moneyIn = totals ? Number(totals.money_in_30d) || 0 : 0;
  const moneyOut = totals ? Number(totals.money_out_30d) || 0 : 0;
  const pending = totals ? Number(totals.pending_count) || 0 : 0;

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className={cardClassName("p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Transaction Volume
            </h3>
            <p className="mt-1 text-xs text-foreground-muted">
              Rolling 30-day totals for completed orders.
            </p>
          </div>
          <DropdownTrigger label="Last 30 days" />
        </div>

        {summary.isLoading ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 w-full" rounded="lg" />
            <Skeleton className="h-20 w-full" rounded="lg" />
            <Skeleton className="h-20 w-full" rounded="lg" />
          </div>
        ) : summary.isError ? (
          <div className="mt-6">
            <EmptyState
              title="Volume unavailable"
              description="We couldn't load your transaction volume right now. Please try again."
            />
          </div>
        ) : (
          <VolumeSummary
            moneyIn={moneyIn}
            moneyOut={moneyOut}
            pending={pending}
          />
        )}
      </div>

      <div className={cardClassName("p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Top Transaction Currencies
          </h3>
          <DropdownTrigger label="This month" compact />
        </div>

        <div className="mt-6">
          <EmptyState
            title="Currency breakdown coming soon"
            description="Per-currency totals will appear here once the analytics endpoint is available."
            icon={<BarChart3 className="h-6 w-6" />}
          />
        </div>
      </div>
    </section>
  );
}
