"use client";

import Flag from "@/components/dashboard/Flag";
import { DropdownTrigger, cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { topCurrencies, volumeData } from "@/components/dashboard/dashboardData";

const flagForCode: Record<string, "KE" | "NG" | "GH"> = {
  KES: "KE",
  NGN: "NG",
  GHS: "GH",
};

function VolumeBars() {
  const yTicks = [0, 10, 20, 30, 40, 50, 60];
  const maxValue = 60_000;
  const chartH = 260;
  const chartPaddingTop = 10;
  const usableH = chartH - chartPaddingTop;

  return (
    <div className="mt-4">
      <div className="flex gap-3">
        {/* Y axis labels */}
        <div
          className="flex flex-col-reverse justify-between pr-1 text-[11px] text-foreground-muted"
          style={{ height: chartH }}
        >
          {yTicks.map((t) => (
            <span key={t}>{t}k</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="relative flex-1">
          {/* Grid lines */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex flex-col-reverse justify-between"
            style={{ height: chartH }}
          >
            {yTicks.map((t) => (
              <div key={t} className="h-px w-full bg-border" />
            ))}
          </div>

          {/* Bars */}
          <div
            className="relative grid grid-cols-12 items-end gap-2"
            style={{ height: chartH, paddingTop: chartPaddingTop }}
          >
            {volumeData.map((d) => {
              const inH = Math.max(2, (d.moneyIn / maxValue) * usableH);
              const outH = Math.max(2, (d.moneyOut / maxValue) * usableH);
              return (
                <div key={d.month} className="flex h-full items-end justify-center gap-1">
                  <div
                    className="w-2.5 rounded-sm bg-primary-500 transition-[height] duration-500 ease-out"
                    style={{ height: inH }}
                    title={`Money In: ${d.moneyIn.toLocaleString()}`}
                  />
                  <div
                    className="w-2.5 rounded-sm bg-secondary-500 transition-[height] duration-500 ease-out"
                    style={{ height: outH }}
                    title={`Money Out: ${d.moneyOut.toLocaleString()}`}
                  />
                </div>
              );
            })}
          </div>

          {/* X axis labels */}
          <div className="mt-2 grid grid-cols-12 gap-2 text-[11px] text-foreground-muted">
            {volumeData.map((d) => (
              <span key={d.month} className="text-center">
                {d.month}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionVolumeChart() {
  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className={cardClassName("p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Transaction Volume Chart</h3>
            <div className="mt-3 flex flex-wrap items-center gap-4 rounded-full border border-border px-3 py-1.5 text-xs text-foreground-muted w-fit">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary-500" />
                Money In
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-secondary-500" />
                Money Out
              </span>
            </div>
          </div>
          <DropdownTrigger label="This year" />
        </div>

        <VolumeBars />
      </div>

      <div className={cardClassName("p-5 sm:p-6")}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">Top Transaction Currencies</h3>
          <DropdownTrigger label="This month" compact />
        </div>

        <div className="mt-6 space-y-6">
          {topCurrencies.map((currency) => (
            <div key={currency.code} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                  <Flag code={flagForCode[currency.code] ?? "KE"} size={18} />
                  <span className="truncate">
                    {currency.name}, {currency.code}
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-foreground">
                  {currency.amount}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-border">
                <div
                  className="h-1.5 rounded-full bg-primary-500 transition-[width] duration-500 ease-out"
                  style={{ width: `${currency.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}