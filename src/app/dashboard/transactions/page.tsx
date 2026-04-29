"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Download, Search, SlidersHorizontal } from "lucide-react";
import TransactionsListTable from "@/components/transactions/TransactionsListTable";
import PendingTransactionsTable from "@/components/transactions/PendingTransactionsTable";
import ExportFiltersModal from "@/components/transactions/ExportFiltersModal";
import DownloadProgressModal from "@/components/transactions/DownloadProgressModal";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import {
  recentTransactions,
  type RecentTransactionRow,
} from "@/components/dashboard/dashboardData";

type FilterId = "all" | "payins" | "payouts" | "successful" | "failed";
type SortId = "newest" | "oldest" | "highest" | "lowest";
type DateFilter = "today" | "7d" | "30d";
type CurrencyFilter = "all" | "usd" | "kes" | "ngn" | "ghs";
type MethodFilter = "all" | "mpesa" | "bank" | "momo";

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "payins", label: "Pay-ins" },
  { id: "payouts", label: "Pay-outs" },
  { id: "successful", label: "Successful" },
  { id: "failed", label: "Failed" },
];

const SORT_OPTIONS: Array<{ id: SortId; label: string }> = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "highest", label: "Highest amount" },
  { id: "lowest", label: "Lowest amount" },
];

const DATE_OPTIONS: Array<{ id: DateFilter; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];

const CURRENCY_OPTIONS: Array<{ id: CurrencyFilter; label: string }> = [
  { id: "all", label: "All currencies" },
  { id: "usd", label: "USD" },
  { id: "kes", label: "KES" },
  { id: "ngn", label: "NGN" },
  { id: "ghs", label: "GHS" },
];

const METHOD_OPTIONS: Array<{ id: MethodFilter; label: string }> = [
  { id: "all", label: "All payment methods" },
  { id: "mpesa", label: "M-Pesa" },
  { id: "bank", label: "Bank transfer" },
  { id: "momo", label: "MTN MoMo" },
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

// Horizontal scrolling row
function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {children}
    </div>
  );
}

function PillDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = options.find((o) => o.id === value)?.label ?? value;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#E7EAF3] bg-white px-3 text-xs font-medium text-[#5C637A] whitespace-nowrap dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#8B92B2]"
      >
        {label}
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div className="absolute left-0 top-full z-40 mt-1 min-w-max overflow-hidden rounded-lg border border-[#ECEEF5] bg-white shadow-[0_12px_40px_rgba(16,24,40,0.12)] dark:border-[#252840] dark:bg-[#13162A]">
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={mergeClasses(
                  "flex w-full items-center px-4 py-2.5 text-xs font-medium transition whitespace-nowrap hover:bg-[#F7F8FC] dark:hover:bg-[#1A1D2E]",
                  opt.id === value
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-[#434A61] dark:text-[#8B92B2]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (v: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const label =
    SORT_OPTIONS.find((o) => o.id === value)?.label ?? "Newest first";

  return (
    <div className="relative w-full shrink-0 sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border border-[#E7EAF3] bg-white px-3 text-xs font-medium text-[#5C637A] dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#8B92B2] sm:w-auto"
      >
        <span className="hidden text-[#9298AC] dark:text-[#4A5070] sm:inline">
          Sort by:
        </span>
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div className="absolute right-0 top-full z-40 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-[#ECEEF5] bg-white shadow-[0_12px_40px_rgba(16,24,40,0.12)] dark:border-[#252840] dark:bg-[#13162A]">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={mergeClasses(
                  "flex w-full items-center px-4 py-2.5 text-xs font-medium transition hover:bg-[#F7F8FC] dark:hover:bg-[#1A1D2E]",
                  opt.id === value
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-[#434A61] dark:text-[#8B92B2]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("newest");
  const [query, setQuery] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [currencyFilter, setCurrencyFilter] =
    useState<CurrencyFilter>("all");
  const [methodFilter, setMethodFilter] =
    useState<MethodFilter>("all");

  const filtered = useMemo(() => {
    let rows = recentTransactions.slice();

    if (filter === "payins") {
      rows = rows.filter((r) => r.direction === "in");
    } else if (filter === "payouts") {
      rows = rows.filter((r) => r.direction === "out");
    } else if (filter === "successful") {
      rows = rows.filter((r) => r.status === "Successful");
    } else if (filter === "failed") {
      rows = rows.filter((r) => r.status === "Failed");
    }

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
      rows.sort(
        (a, b) =>
          Math.abs(amountValue(b.amount)) -
          Math.abs(amountValue(a.amount)),
      );
    } else if (sort === "lowest") {
      rows.sort(
        (a, b) =>
          Math.abs(amountValue(a.amount)) -
          Math.abs(amountValue(b.amount)),
      );
    } else if (sort === "oldest") {
      rows.reverse();
    }

    return rows;
  }, [filter, sort, query]);

  function handleExportDownload(_columns: string[]) {
    setShowExportModal(false);
    setShowProgressModal(true);

    const csv = toCSV(filtered);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `transactions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <section className="space-y-4 sm:space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-start justify-between gap-3 sm:items-center">
          <div>
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#171D32] dark:text-[#E8ECF8] sm:text-[24px]">
              Transactions
            </h1>

            <p className="mt-0.5 max-w-[90%] text-xs text-[#7E8498] dark:text-[#5A6080] sm:text-sm">
              Track every pay-in, pay-out, and pending settlement across your
              wallets.
            </p>
          </div>

          {/* Mobile export */}
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            aria-label="Export CSV"
            className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white transition hover:brightness-105 sm:hidden"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* Search + Sort */}
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 w-full flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9CA3B6] dark:text-[#4A5070]" />

            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transactions…"
              className="h-9 w-full rounded-lg border border-[#E7EAF3] bg-white pl-8 pr-3 text-xs text-[#1F2640] outline-none transition placeholder:text-[#9CA3B6] focus:border-primary-300 dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#E8ECF8] dark:placeholder:text-[#4A5070]"
            />
          </div>

          <SortDropdown value={sort} onChange={setSort} />

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="hidden h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 text-xs font-semibold text-white transition hover:brightness-105 sm:inline-flex"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Filters */}
      <ScrollRow>
        <PillDropdown
          value={dateFilter}
          options={DATE_OPTIONS}
          onChange={setDateFilter}
        />

        <PillDropdown
          value={currencyFilter}
          options={CURRENCY_OPTIONS}
          onChange={setCurrencyFilter}
        />

        <PillDropdown
          value={methodFilter}
          options={METHOD_OPTIONS}
          onChange={setMethodFilter}
        />

        <div
          className="h-4 w-px shrink-0 bg-[#E7EAF3] dark:bg-[#2A3050]"
          aria-hidden
        />

        {(["payins", "payouts", "successful", "failed"] as FilterId[]).map(
          (id) => {
            const labels: Record<string, string> = {
              payins: "Pay-ins",
              payouts: "Pay-outs",
              successful: "Successful",
              failed: "Failed",
            };

            return (
              <button
                key={id}
                type="button"
                onClick={() =>
                  setFilter((prev) => (prev === id ? "all" : id))
                }
                className={mergeClasses(
                  "inline-flex h-8 shrink-0 items-center rounded-lg border px-3 text-xs font-medium whitespace-nowrap transition",
                  filter === id
                    ? "border-primary-200 bg-primary-100/60 text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "border-[#E7EAF3] bg-white text-[#5C637A] dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#8B92B2]",
                )}
              >
                {labels[id]}
              </button>
            );
          },
        )}
      </ScrollRow>

      {/* Transaction History */}
      <div className="rounded-2xl border border-[#ECEEF5] bg-white p-3 shadow-[0_4px_30px_rgba(16,24,40,0.04)] dark:border-[#252840] dark:bg-[#13162A] sm:p-4 lg:p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="shrink-0 text-sm font-semibold text-[#1C2238] dark:text-[#E0E5F5]">
            Transaction history
          </h2>

          <ScrollRow>
            <button
              type="button"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#E7EAF3] bg-white px-3 py-1.5 text-xs font-medium text-[#677089] dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#8B92B2]"
            >
              <SlidersHorizontal className="h-3 w-3" />
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
                    "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition",
                    active
                      ? "border-primary-200 bg-primary-100/60 text-primary-700 dark:border-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      : "border-[#E8EAF2] bg-white text-[#7D8398] dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#8B92B2]",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </ScrollRow>
        </div>

        <TransactionsListTable rows={filtered} />
      </div>

      {/* Pending Payments */}
      <div className="rounded-2xl border border-[#ECEEF5] bg-white p-3 shadow-[0_4px_30px_rgba(16,24,40,0.04)] dark:border-[#252840] dark:bg-[#13162A] sm:p-4 lg:p-6">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[#1C2238] dark:text-[#E0E5F5]">
            Pending payments
          </h2>

          <p className="mt-0.5 text-xs text-[#8D92A6] dark:text-[#5A6080]">
            Awaiting settlement or counterparty confirmation.
          </p>
        </div>

        <PendingTransactionsTable />
      </div>

      {showExportModal && (
        <ExportFiltersModal
          totalCount={filtered.length}
          onClose={() => setShowExportModal(false)}
          onDownload={handleExportDownload}
        />
      )}

      {showProgressModal && (
        <DownloadProgressModal
          onClose={() => setShowProgressModal(false)}
        />
      )}
    </section>
  );
}