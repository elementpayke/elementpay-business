"use client";

import { useMemo } from "react";
import { Search } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import RecipientsPreviewTable from "@/components/bulk-payment/RecipientsPreviewTable";
import RecipientsTablePagination from "@/components/bulk-payment/RecipientsTablePagination";
import { useBulkPaymentStore, type RowFilter } from "@/stores/bulkPaymentStore";

const FILTERS: { key: RowFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "valid", label: "Valid" },
  { key: "invalid", label: "Invalid" },
];

function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function RecipientsPreviewStep() {
  const parseResult = useBulkPaymentStore((s) => s.parseResult);
  const search = useBulkPaymentStore((s) => s.search);
  const rowFilter = useBulkPaymentStore((s) => s.rowFilter);
  const page = useBulkPaymentStore((s) => s.page);
  const pageSize = useBulkPaymentStore((s) => s.pageSize);
  const setSearch = useBulkPaymentStore((s) => s.setSearch);
  const setRowFilter = useBulkPaymentStore((s) => s.setRowFilter);
  const setPage = useBulkPaymentStore((s) => s.setPage);
  const setPageSize = useBulkPaymentStore((s) => s.setPageSize);
  const setPhase = useBulkPaymentStore((s) => s.setPhase);

  const filteredRows = useMemo(() => {
    if (!parseResult) return [];
    const normalized = search.trim().toLowerCase();
    return parseResult.rows.filter((row) => {
      if (rowFilter !== "all" && row.status !== rowFilter) return false;
      if (!normalized) return true;
      const haystack = [
        row.payload.recipientName,
        row.payload.recipientIdentifier,
        row.payload.email ?? "",
        row.payload.phoneNumber ?? "",
        row.payload.country,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [parseResult, search, rowFilter]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  if (!parseResult) return null;

  const { summary } = parseResult;
  const hasValid = summary.validCount > 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Contacts found" value={summary.totalRows.toString()} />
        <Stat label="Valid recipients" value={summary.validCount.toString()} tone="valid" />
        <Stat label="Invalid recipients" value={summary.invalidCount.toString()} tone={summary.invalidCount > 0 ? "warning" : "neutral"} />
        <Stat
          label="Total payout"
          value={`${summary.currencies[0] ?? ""} ${formatAmount(summary.totalAmount)}`.trim()}
        />
      </div>

      <div className={cardClassName("p-4 sm:p-5")}>
        <div className="flex flex-col gap-3 border-b border-[#EFF1F7] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A4A8B7]" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search recipients"
              aria-label="Search recipients"
              className="h-10 w-full rounded-lg border border-[#E1E4EE] bg-white pl-9 pr-3 text-sm text-[#1D243C] outline-none transition focus:border-primary-300"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const active = rowFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setRowFilter(filter.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "border-primary-200 bg-primary-50 text-primary-700"
                      : "border-[#E1E4EE] bg-white text-[#5C637A] hover:border-[#CBD2E5]"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4">
          <RecipientsPreviewTable rows={pagedRows} />
        </div>

        <RecipientsTablePagination
          page={page}
          pageSize={pageSize}
          totalRows={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setPhase("csv-upload")}
          className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Back to upload
        </button>
        <button
          type="button"
          disabled={!hasValid}
          onClick={() => setPhase("payment-review")}
          className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#B4B9CC]"
        >
          Continue to review
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "valid" | "warning";
}) {
  const valueTone =
    tone === "valid"
      ? "text-tertiary-700"
      : tone === "warning"
      ? "text-[#B23A4E]"
      : "text-[#1D243C]";

  return (
    <div className={cardClassName("p-4")}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8D92A6]">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${valueTone}`}>{value}</p>
    </div>
  );
}
