"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock3 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useAuth } from "@/lib/AuthContext";
import { MAX_BULK_EXECUTE_ROWS } from "@/lib/payments/bulkOfframp";
import { submitBulkBatch } from "@/lib/payments/bulkService";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
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

  const { user, business } = useAuth();
  const { selectedWallet, selectedWalletAddress } = useSelectedWallet();
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validRows = useMemo(
    () => parseResult?.rows.filter((row) => row.status === "valid") ?? [],
    [parseResult],
  );

  if (!parseResult) return null;

  const { summary } = parseResult;
  const primaryCurrency = summary.currencies[0] ?? "";
  const overLimit = summary.validCount > MAX_BULK_EXECUTE_ROWS;

  async function startBatch() {
    if (!selectedWalletAddress) {
      setError({
        code: "no_wallet",
        message: "Connect your business treasury wallet before starting a bulk payout.",
        retryable: false,
      });
      return;
    }
    setSubmitting(true);
    try {
      const { batchId } = await submitBulkBatch({
        validRows,
        reference: reference || undefined,
        sender: {
          refundAddress: selectedWalletAddress,
          senderName: business?.name ?? business?.legal_name ?? undefined,
          senderCountry: business?.country ?? undefined,
          senderEmail: user?.email,
        },
      });
      setBatchId(batchId);
      setPhase("processing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start batch";
      setError({ code: "submit_failed", message, retryable: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cardClassName("space-y-5 p-5 sm:p-6")}>
      <div className="text-center">
        <p className="text-xs text-[#8E93A7]">You&apos;re about to send</p>
        <p className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-[#171D32]">
          {primaryCurrency} {formatAmount(summary.totalAmount)}
        </p>
        <p className="mt-1 text-xs text-[#8E93A7]">
          Each row is quoted live; USDT is debited from your treasury per recipient.
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

      {overLimit ? (
        <div className="flex items-start gap-3 rounded-xl border border-[#F5D69A] bg-[#FFF8E5] p-4 text-xs text-[#8A5F1A]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            This batch has {summary.validCount} recipients. MVP limit is {MAX_BULK_EXECUTE_ROWS} per
            run — remove rows or split the file.
          </p>
        </div>
      ) : null}

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
        <Row label="Source wallet">
          {selectedWallet?.label ?? selectedWalletAddress ?? "—"}
        </Row>
        <Row label="Settlement">USDT on Polygon → local fiat per row</Row>
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

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] p-4 text-sm text-[#4D556D]">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-[#CBD2E5]"
        />
        <span>
          I authorize ElementPay to quote and accept each payout from our business treasury wallet.
          USDT transfers are submitted automatically when Privy custodial signing is enabled.
        </span>
      </label>

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
          disabled={summary.validCount === 0 || overLimit || !acknowledged || submitting}
          className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#B4B9CC]"
        >
          {submitting ? "Starting…" : "Start bulk transfer"}
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
