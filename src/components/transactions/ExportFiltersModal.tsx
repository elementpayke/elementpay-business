"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";

type DateRange = "today" | "7d" | "30d" | "3m" | "1y" | "custom";
type Currency = "all" | "kes" | "ghs" | "ngn";
type PaymentMethod = "all" | "mpesa_mobile" | "mpesa_paybill" | "bank_transfer" | "mtn_momo" | "vodafone_cash";
type PaymentCategory = "all" | "payins" | "payouts";
type TxnStatus = "successful" | "pending" | "failed";

const DATE_TABS: Array<{ id: DateRange; label: string }> = [
  { id: "today", label: "Today" },
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "3m", label: "3 months" },
  { id: "1y", label: "1 year" },
  { id: "custom", label: "Custom" },
];

const CURRENCIES: Array<{ id: Currency; label: string }> = [
  { id: "all", label: "All" },
  { id: "kes", label: "Kenyan Shillings" },
  { id: "ghs", label: "Ghanaian Cedis" },
  { id: "ngn", label: "Nigerian Naira" },
];

const PAYMENT_METHODS: Array<{ id: PaymentMethod; label: string }> = [
  { id: "all", label: "All" },
  { id: "mpesa_mobile", label: "M-Pesa Mobile" },
  { id: "mpesa_paybill", label: "M-Pesa Paybill" },
  { id: "bank_transfer", label: "Bank transfer" },
  { id: "mtn_momo", label: "MTN MoMo" },
  { id: "vodafone_cash", label: "Vodafone Cash" },
];

const DATA_COLUMNS: Array<{ id: string; label: string }> = [
  { id: "client_name", label: "Client name" },
  { id: "client_email", label: "Client email" },
  { id: "txn_category", label: "Txn category" },
  { id: "txn_type", label: "Txn type" },
  { id: "payment_method", label: "Payment method" },
  { id: "txn_status", label: "Txn status" },
  { id: "fees", label: "Fees" },
  { id: "amount", label: "Amount" },
  { id: "detail_amount", label: "Detail amount" },
  { id: "txn_id", label: "Txn ID" },
  { id: "transacting_wallet", label: "Transacting wallet" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={mergeClasses(
        "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-primary-400 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/30 dark:text-primary-300"
          : "border-[#E7EAF3] bg-white text-[#5C637A] hover:border-[#CDD2E0] dark:border-[#2A3050] dark:bg-[#1A1D2E] dark:text-[#8B92B2]",
      )}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold text-[#5C637A] dark:text-[#7A80A0]">{children}</p>
  );
}

function Field({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-lg border border-[#E7EAF3] bg-white px-3 text-xs text-[#1F2640] placeholder:text-[#9CA3B6] outline-none transition focus:border-primary-300 dark:border-[#2A3050] dark:bg-[#1A1D2E] dark:text-[#E8ECF8] dark:placeholder:text-[#4A5070]"
    />
  );
}

export interface ExportFiltersModalProps {
  totalCount?: number;
  onClose: () => void;
  onDownload: (columns: string[]) => void;
}

export default function ExportFiltersModal({
  totalCount = 182,
  onClose,
  onDownload,
}: ExportFiltersModalProps) {
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [currency, setCurrency] = useState<Currency>("kes");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa_mobile");
  const [category, setCategory] = useState<PaymentCategory>("payins");
  const [statuses, setStatuses] = useState<Set<TxnStatus>>(new Set(["successful"]));
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(["client_name", "client_email", "txn_status", "txn_type", "fees", "amount"]),
  );
  const [csvColumns, setCsvColumns] = useState<string[]>([
    "client_name", "client_email", "txn_status", "txn_type", "fees", "amount",
  ]);

  const columnLabel = (id: string) => DATA_COLUMNS.find((c) => c.id === id)?.label ?? id;

  function toggleStatus(s: TxnStatus) {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleColumn(id: string) {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-[#ECEEF5] bg-white shadow-[0_-8px_40px_rgba(16,24,40,0.12)] sm:max-w-[480px] sm:rounded-2xl sm:shadow-[0_32px_80px_rgba(16,24,40,0.18)] dark:border-[#252840] dark:bg-[#13162A]">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-[#E0E3EE] dark:bg-[#2A3050]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0F2F7] px-5 py-4 dark:border-[#252840]">
          <h2 className="text-base font-semibold text-[#171D32] dark:text-[#E8ECF8]">
            Export Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8D92A6] transition hover:bg-[#F5F6FA] dark:hover:bg-[#1F2235]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Info banner */}
          <p className="rounded-lg bg-[#F5F7FF] px-3.5 py-2.5 text-xs text-[#5C637A] dark:bg-[#1A1F38] dark:text-[#8B92B2]">
            There are{" "}
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {totalCount} transactions
            </span>{" "}
            that match your selected filter options.
          </p>

          {/* Date range */}
          <div>
            <Label>Date range</Label>
            <div className="flex flex-wrap gap-1.5">
              {DATE_TABS.map((t) => (
                <Chip key={t.id} active={dateRange === t.id} onClick={() => setDateRange(t.id)}>
                  {t.label}
                </Chip>
              ))}
            </div>
            {dateRange === "custom" && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1 text-[11px] text-[#8D92A6]">Start date</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E7EAF3] bg-white px-3 text-xs outline-none focus:border-primary-300 dark:border-[#2A3050] dark:bg-[#1A1D2E] dark:text-[#E8ECF8]"
                  />
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-[#8D92A6]">End date</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E7EAF3] bg-white px-3 text-xs outline-none focus:border-primary-300 dark:border-[#2A3050] dark:bg-[#1A1D2E] dark:text-[#E8ECF8]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Client */}
          <div>
            <Label>Client name + email address</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field placeholder="Client name" value={clientName} onChange={setClientName} />
              <Field placeholder="Client email address" value={clientEmail} onChange={setClientEmail} />
            </div>
          </div>

          {/* Currency */}
          <div>
            <Label>Currency</Label>
            <div className="flex flex-wrap gap-1.5">
              {CURRENCIES.map((c) => (
                <Chip key={c.id} active={currency === c.id} onClick={() => setCurrency(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Amount range */}
          <div>
            <Label>Amount range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Field placeholder="Min amount" value={minAmount} onChange={setMinAmount} />
              <Field placeholder="Max amount" value={maxAmount} onChange={setMaxAmount} />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <Label>Payment method</Label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m.id} active={paymentMethod === m.id} onClick={() => setPaymentMethod(m.id)}>
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Payment category */}
          <div>
            <Label>Payment category</Label>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "payins", label: "Pay-ins" },
                  { id: "payouts", label: "Pay-outs" },
                ] as Array<{ id: PaymentCategory; label: string }>
              ).map((c) => (
                <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Transaction status */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Transaction status</Label>
              <button
                type="button"
                onClick={() => setStatuses(new Set(["successful", "pending", "failed"]))}
                className="text-xs font-medium text-primary-600 dark:text-primary-400"
              >
                Select all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "successful", label: "Successful" },
                  { id: "pending", label: "Pending" },
                  { id: "failed", label: "Failed" },
                ] as Array<{ id: "all" | TxnStatus; label: string }>
              ).map((s) => {
                const active =
                  s.id === "all" ? statuses.size === 3 : statuses.has(s.id as TxnStatus);
                return (
                  <Chip
                    key={s.id}
                    active={active}
                    onClick={() =>
                      s.id === "all"
                        ? setStatuses(new Set(["successful", "pending", "failed"]))
                        : toggleStatus(s.id as TxnStatus)
                    }
                  >
                    {s.label}
                  </Chip>
                );
              })}
            </div>
          </div>

          {/* Available data columns */}
          <div>
            <Label>Available data columns</Label>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {DATA_COLUMNS.map((col) => {
                const checked = selectedColumns.has(col.id);
                return (
                  <label
                    key={col.id}
                    className="flex cursor-pointer items-center gap-2 text-xs text-[#434A61] dark:text-[#8B92B2]"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggleColumn(col.id)}
                      className={mergeClasses(
                        "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition",
                        checked
                          ? "border-primary-500 bg-primary-500"
                          : "border-[#CDD2E0] bg-white dark:border-[#3A4060] dark:bg-[#1F2235]",
                      )}
                    >
                      {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </button>
                    {col.label}
                  </label>
                );
              })}
            </div>
          </div>

          {/* CSV columns */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Columns to be in the CSV</Label>
              <button
                type="button"
                onClick={() => setCsvColumns([])}
                className="text-xs font-medium text-[#E25555] dark:text-red-400"
              >
                Remove all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {csvColumns.map((col) => (
                <span
                  key={col}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F0F2F7] px-2.5 py-1 text-xs font-medium text-[#434A61] dark:bg-[#252840] dark:text-[#9298B8]"
                >
                  {columnLabel(col)}
                  <button
                    type="button"
                    onClick={() => setCsvColumns((prev) => prev.filter((c) => c !== col))}
                    className="ml-0.5 text-[#9298AC] transition hover:text-[#434A61]"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              {csvColumns.length === 0 && (
                <span className="text-xs text-[#9CA3B6] dark:text-[#4A5070]">
                  No columns selected
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#F0F2F7] px-5 py-4 dark:border-[#252840]">
          <button
            type="button"
            onClick={() => onDownload(csvColumns)}
            className="h-10 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 active:scale-[0.99]"
          >
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}
