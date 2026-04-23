"use client";

import { useMemo } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { submitBulkBatch } from "@/lib/payments/bulkService";
import { useBulkPaymentStore } from "@/stores/bulkPaymentStore";

function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PaymentReviewStep() {
  const parseResult = useBulkPaymentStore((s) => s.parseResult);
  const reference = useBulkPaymentStore((s) => s.reference);
  const setReference = useBulkPaymentStore((s) => s.setReference);
  const setPhase = useBulkPaymentStore((s) => s.setPhase);
  const setBatchId = useBulkPaymentStore((s) => s.setBatchId);
  const setError = useBulkPaymentStore((s) => s.setError);

  const { selectedWallet } = useSelectedWallet();

  const validRows = useMemo(
    () => parseResult?.rows.filter((row) => row.status === "valid") ?? [],
    [parseResult],
  );

  if (!parseResult) return null;

  const { summary } = parseResult;
  const primaryCurrency = summary.currencies[0] ?? "";
  const estimatedFees = summary.validCount * 5;
  const totalDebit = summary.totalAmount + estimatedFees;

  async function startBatch() {
    try {
      const { batchId } = await submitBulkBatch({
        validRows,
        reference: reference || undefined,
      });
      setBatchId(batchId);
      setPhase("processing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start batch";
      setError({ code: "submit_failed", message, retryable: true });
    }
  }

  return (
    <div className={cardClassName("space-y-5 p-5 sm:p-6")}>
      <div className="text-center">
        <p className="text-xs text-[#8E93A7]">You&apos;re about to send</p>
        <p className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-[#171D32]">
          {primaryCurrency} {formatAmount(summary.totalAmount)}
        </p>
        <p className="mt-1 text-xs font-medium text-tertiary-700">
          + Estimated fees: {primaryCurrency} {formatAmount(estimatedFees)}
        </p>
        <p className="mt-4 text-xs text-[#8E93A7]">to</p>
        <p className="mt-1 text-base font-semibold text-[#1D243C]">
          {summary.validCount} recipient{summary.validCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-tertiary-200 bg-tertiary-50 px-4 py-3 text-xs font-medium text-tertiary-700">
        <Clock3 className="h-4 w-4" />
        <span>Transfers run in the background — you can safely navigate away after confirming.</span>
      </div>

      {summary.invalidCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#F5D69A] bg-[#FFF8E5] p-4 text-xs text-[#8A5F1A]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {summary.invalidCount} invalid row{summary.invalidCount === 1 ? " was" : "s were"} skipped. Fix and reupload
            to include them.
          </p>
        </div>
      ) : null}

      <dl className="divide-y divide-[#EFF2F7] text-sm">
        <Row label="Total recipients">{summary.validCount}</Row>
        <Row label="Total amount">
          {primaryCurrency} {formatAmount(summary.totalAmount)}
        </Row>
        <Row label="Estimated fees">
          {primaryCurrency} {formatAmount(estimatedFees)}
        </Row>
        <Row label="Net debit">
          {primaryCurrency} {formatAmount(totalDebit)}
        </Row>
        <Row label="Source wallet">{selectedWallet?.label ?? "Default wallet"}</Row>
        <Row label="Currencies">{summary.currencies.join(", ") || "—"}</Row>
      </dl>

      <div>
        <label className="mb-2 block text-xs text-[#4D556D]">Reference (Optional)</label>
        <textarea
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          rows={3}
          placeholder="e.g. Payroll — December 2025"
          className="w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setPhase("recipients-preview")}
          className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Back to preview
        </button>
        <button
          type="button"
          onClick={startBatch}
          disabled={summary.validCount === 0}
          className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#B4B9CC]"
        >
          Start bulk transfer
        </button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-[#8E93A7]">{label}</dt>
      <dd className="text-right font-medium text-[#1D243C]">{children}</dd>
    </div>
  );
}
