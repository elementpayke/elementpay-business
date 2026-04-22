"use client";

import { Checkbox } from "@/components/invoices/formPrimitives";
import { calculateTotals, formatInvoiceMoney, useInvoiceStore } from "@/stores/invoiceStore";

export default function PricingSummary() {
  const draft = useInvoiceStore((s) => s.draft);
  const setDraft = useInvoiceStore((s) => s.setDraft);
  const totals = calculateTotals(draft);
  const currency = draft.preferredCurrency || "USD";

  return (
    <section className="flex justify-end">
      <div className="w-full max-w-xl space-y-3 text-sm">
        <SummaryRow label="Subtotal" value={formatInvoiceMoney(totals.subtotal, currency)} />

        <div className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={draft.vatEnabled}
              onChange={(next) => setDraft((d) => ({ ...d, vatEnabled: next }))}
            />
            <span className="text-[#3F465E]">VAT</span>
          </div>
          <PercentInput
            disabled={!draft.vatEnabled}
            value={draft.vatPercent}
            onChange={(v) => setDraft((d) => ({ ...d, vatPercent: v }))}
          />
          <div className="text-right font-medium text-[#1F2640]">
            +{formatInvoiceMoney(totals.vat, currency)}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={draft.discountEnabled}
              onChange={(next) => setDraft((d) => ({ ...d, discountEnabled: next }))}
            />
            <span className="text-[#3F465E]">Discount</span>
          </div>
          <PercentInput
            disabled={!draft.discountEnabled}
            value={draft.discountPercent}
            onChange={(v) => setDraft((d) => ({ ...d, discountPercent: v }))}
          />
          <div className="text-right font-medium text-[#1F2640]">
            {totals.discount > 0 ? "-" : ""}{formatInvoiceMoney(totals.discount, currency)}
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)] items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={draft.shippingEnabled}
              onChange={(next) => setDraft((d) => ({ ...d, shippingEnabled: next }))}
            />
            <span className="text-[#3F465E]">Shipping</span>
          </div>
          <AmountInput
            disabled={!draft.shippingEnabled}
            currency={currency}
            value={draft.shippingAmount}
            onChange={(v) => setDraft((d) => ({ ...d, shippingAmount: v }))}
          />
          <div className="text-right font-medium text-[#1F2640]">
            +{formatInvoiceMoney(totals.shipping, currency)}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#ECEEF4] pt-3">
          <span className="text-sm font-semibold text-[#1C2238]">Total</span>
          <span className="text-base font-bold text-tertiary-500">
            {formatInvoiceMoney(totals.total, currency)}
          </span>
        </div>
      </div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#3F465E]">{label}</span>
      <span className="font-medium text-[#1F2640]">{value}</span>
    </div>
  );
}

function PercentInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex h-9 items-center justify-between rounded-md border border-[#ECEEF4] bg-[#FAFBFE] px-2.5 text-sm transition ${
        disabled ? "opacity-50" : "focus-within:border-primary-300 focus-within:bg-white"
      }`}
    >
      <input
        type="number"
        min="0"
        step="1"
        disabled={disabled}
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="min-w-0 flex-1 bg-transparent text-sm text-[#1F2640] outline-none"
      />
      <span className="text-xs text-[#8E93A7]">%</span>
    </div>
  );
}

function AmountInput({
  value,
  onChange,
  disabled,
  currency,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  currency: string;
}) {
  return (
    <div
      className={`flex h-9 items-center gap-1 rounded-md border border-[#ECEEF4] bg-[#FAFBFE] px-2.5 text-sm transition ${
        disabled ? "opacity-50" : "focus-within:border-primary-300 focus-within:bg-white"
      }`}
    >
      <span className="text-xs font-medium text-[#8E93A7]">{currency}</span>
      <input
        type="number"
        min="0"
        step="0.01"
        disabled={disabled}
        value={value || ""}
        placeholder="0.00"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="min-w-0 flex-1 bg-transparent text-right text-sm text-[#1F2640] outline-none"
      />
    </div>
  );
}
