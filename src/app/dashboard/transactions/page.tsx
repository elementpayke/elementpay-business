"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, Search, SlidersHorizontal } from "lucide-react";
import TransactionsListTable from "@/components/transactions/TransactionsListTable";
import PendingTransactionsTable from "@/components/transactions/PendingTransactionsTable";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import {
  recentTransactions,
  type RecentTransactionRow,
} from "@/components/dashboard/dashboardData";

type FilterId = "all" | "payins" | "payouts" | "successful" | "failed";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "payins", label: "Pay-ins" },
  { id: "payouts", label: "Pay-outs" },
  { id: "successful", label: "Successful" },
  { id: "failed", label: "Failed" },
];

type SortId = "newest" | "oldest" | "highest" | "lowest";

const SORT_OPTIONS: Array<{ id: SortId; label: string }> = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "highest", label: "Highest amount" },
  { id: "lowest", label: "Lowest amount" },
];

function amountValue(raw: string) {
  const num = Number(raw.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function toCSV(rows: RecentTransactionRow[]) {
  const header = [
    "id",
    "client",
    "country",
    "date",
    "direction",
    "type",
    "paymentMethod",
    "status",
    "fees",
    "amount",
    "reference",
  ];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [
      r.id,
      r.client,
      r.country,
      r.date,
      r.direction,
      r.type,
      r.paymentMethod,
      r.status,
      r.fees,
      r.amount,
      r.reference,
    ]
      .map((c) => esc(String(c)))
      .join(","),
  );
  return [header.join(","), ...body].join("\n");
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (v: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = SORT_OPTIONS.find((o) => o.id === value)?.label ?? "Sort by";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E7EAF3] bg-white px-3 text-xs font-medium text-[#5C637A] transition hover:border-[#CDD2E0] hover:text-[#2A3150]"
      >
        <span className="text-[#9298AC]">Sort by:</span>
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-lg border border-[#ECEEF5] bg-white shadow-[0_12px_40px_rgba(16,24,40,0.12)]">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={mergeClasses(
                  "flex w-full items-center justify-between px-3.5 py-2.5 text-xs font-medium transition hover:bg-[#F7F8FC]",
                  opt.id === value ? "text-primary-600" : "text-[#434A61]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("newest");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let rows = recentTransactions.slice();

    if (filter === "payins") rows = rows.filter((r) => r.direction === "in");
    else if (filter === "payouts") rows = rows.filter((r) => r.direction === "out");
    else if (filter === "successful") rows = rows.filter((r) => r.status === "Successful");
    else if (filter === "failed") rows = rows.filter((r) => r.status === "Failed");

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.client.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q),
      );
    }

    if (sort === "highest") {
      rows.sort((a, b) => Math.abs(amountValue(b.amount)) - Math.abs(amountValue(a.amount)));
    } else if (sort === "lowest") {
      rows.sort((a, b) => Math.abs(amountValue(a.amount)) - Math.abs(amountValue(b.amount)));
    } else if (sort === "oldest") {
      rows.reverse();
    }

    return rows;
  }, [filter, sort, query]);

  function handleExport() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#171D32]">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-[#7E8498]">
            Track every pay-in, pay-out, and pending settlement across your wallets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3B6]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by client, ref, ID"
              className="h-9 w-[260px] rounded-lg border border-[#E7EAF3] bg-white pl-8 pr-3 text-xs text-[#1F2640] outline-none transition placeholder:text-[#9CA3B6] focus:border-primary-300"
            />
          </label>
          <SortDropdown value={sort} onChange={setSort} />
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary-500 px-3.5 text-xs font-semibold text-white transition hover:brightness-105"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-[#ECEEF5] bg-white p-6 shadow-[0_4px_30px_rgba(16,24,40,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <h2 className="text-sm font-semibold text-[#1C2238]">Transaction history</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[#E7EAF3] bg-white px-3 py-1.5 text-xs font-medium text-[#677089] transition hover:border-[#D6DBEA] hover:text-[#222945]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
            </button>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={mergeClasses(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    active
                      ? "border-primary-200 bg-primary-100/60 text-primary-700"
                      : "border-[#E8EAF2] bg-white text-[#7D8398] hover:border-[#D6DBEA] hover:text-[#222945]",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <TransactionsListTable rows={filtered} />
      </div>

      <div className="rounded-2xl border border-[#ECEEF5] bg-white p-6 shadow-[0_4px_30px_rgba(16,24,40,0.04)]">
        <div className="flex items-center justify-between pb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#1C2238]">Pending payments</h2>
            <p className="mt-1 text-xs text-[#8D92A6]">
              Awaiting settlement or counterparty confirmation.
            </p>
          </div>
        </div>
        <PendingTransactionsTable />
      </div>
    </section>
  );
}
