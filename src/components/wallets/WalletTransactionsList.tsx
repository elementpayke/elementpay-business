"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import {
  mergeClasses,
  StatusBadge,
} from "@/components/dashboard/DashboardPrimitives";

export type WalletTransaction = {
  id: string;
  date: string;
  type: string;
  rail: string;
  amount: string;
  direction: "in" | "out";
  status:
    | "Completed"
    | "Pending"
    | "Failed";
  reference: string;
};

type Filter =
  | "all"
  | "in"
  | "out"
  | "Failed"
  | "Pending";

const FILTERS: {
  key: Filter;
  label: string;
}[] = [
  { key: "all", label: "All" },
  {
    key: "in",
    label: "Incoming",
  },
  {
    key: "out",
    label: "Outgoing",
  },
  {
    key: "Failed",
    label: "Failed",
  },
  {
    key: "Pending",
    label: "Pending",
  },
];

export default function WalletTransactionsList({
  transactions,
}: {
  transactions: WalletTransaction[];
}) {
  const [filter, setFilter] =
    useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") {
      return transactions;
    }

    if (
      filter === "in" ||
      filter === "out"
    ) {
      return transactions.filter(
        (t) =>
          t.direction === filter,
      );
    }

    return transactions.filter(
      (t) =>
        t.status === filter,
    );
  }, [transactions, filter]);

  const empty = (
    <div
      className="
        rounded-xl border border-dashed px-5 py-12 text-center
        border-border bg-surface
      "
    >
      <p className="text-sm font-medium text-foreground">
        No transactions yet
      </p>

      <p className="mt-1 text-xs text-foreground-muted">
        On-chain activity will appear here once you
        start sending or receiving USDC.
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() =>
              setFilter(f.key)
            }
            className={mergeClasses(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === f.key
                ? "border-primary-200 bg-primary-100/60 text-primary-700"
                : "border-border bg-surface text-foreground-muted hover:border-primary-300 hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        empty
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full text-left text-sm">
              <thead
                className="
                  bg-surface text-xs font-medium uppercase tracking-[0.06em]
                  text-foreground-muted
                "
              >
                <tr>
                  {[
                    "Date",
                    "Type",
                    "Rail",
                    "Amount",
                    "Status",
                    "Reference",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="
                        bg-surface-muted px-4 py-10 text-center text-sm
                        text-foreground-muted
                      "
                    >
                      No transactions match this
                      filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="bg-surface-muted"
                    >
                      <td className="px-4 py-3 text-foreground-muted">
                        {t.date}
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-medium text-foreground">
                          {t.direction ===
                          "in" ? (
                            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5 text-secondary-400" />
                          )}

                          {t.type}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-foreground-muted">
                        {t.rail}
                      </td>

                      <td className="px-4 py-3 font-medium text-foreground">
                        {t.amount}
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge
                          status={
                            t.status
                          }
                        />
                      </td>

                      <td className="px-4 py-3 text-foreground-muted">
                        {t.reference}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-2 md:hidden">
            {filtered.length === 0 ? (
              <li
                className="
                  rounded-xl border border-dashed px-5 py-8 text-center text-sm
                  border-border bg-surface text-foreground-muted
                "
              >
                No transactions match this
                filter.
              </li>
            ) : (
              filtered.map((t) => (
                <li
                  key={t.id}
                  className="
                    rounded-xl border px-4 py-3
                    border-border bg-surface
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {t.direction ===
                      "in" ? (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                          <ArrowDownLeft className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-foreground-muted">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      )}

                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t.type}
                        </p>

                        <p className="text-xs text-foreground-muted">
                          {t.rail} ·{" "}
                          {t.date}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {t.amount}
                      </p>

                      <div className="mt-1">
                        <StatusBadge
                          status={
                            t.status
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-foreground-muted">
                    Ref: {t.reference}
                  </p>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}