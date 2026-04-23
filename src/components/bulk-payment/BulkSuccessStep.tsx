"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, PartyPopper } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { toFailedRowsCsv } from "@/lib/payments/bulkCsv";
import { useBulkPaymentStore } from "@/stores/bulkPaymentStore";

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds}s`;
}

function triggerCsvDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function BulkSuccessStep() {
  const router = useRouter();
  const result = useBulkPaymentStore((s) => s.result);
  const reset = useBulkPaymentStore((s) => s.reset);

  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const partial = result.failed > 0;

  async function copyBatchId() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.batchId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function downloadFailedRows() {
    if (!result || result.failedRows.length === 0) return;
    const csv = toFailedRowsCsv(result.failedRows);
    triggerCsvDownload(`failed-rows-${result.batchId}.csv`, csv);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-[#FFF0F3] p-6 text-[#FF6687]">
          <PartyPopper className="h-16 w-16" />
        </div>
      </div>

      <div className={cardClassName("space-y-5 p-6")}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#171D32]">
            {partial ? "Bulk payment partially complete" : "Bulk payment complete!"}
          </h2>
          <p className="mt-2 text-sm text-[#7E8498]">
            {result.successful} of {result.totalRecipients} transfer
            {result.totalRecipients === 1 ? "" : "s"} {result.successful === 1 ? "was" : "were"} sent successfully.
          </p>
        </div>

        <dl className="divide-y divide-[#EFF2F7] text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Batch ID</dt>
            <dd className="flex items-center gap-2 font-medium text-[#1D243C]">
              <span>{result.batchId}</span>
              <button
                type="button"
                onClick={copyBatchId}
                aria-label="Copy batch ID"
                className="rounded-md border border-[#E1E4EE] p-1.5 text-[#5C637A] transition hover:border-primary-300 hover:text-primary-700"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#1E9F72]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </dd>
          </div>
          <Row label="Total recipients">{result.totalRecipients}</Row>
          <Row label="Successful transfers">{result.successful}</Row>
          <Row label="Failed transfers">{result.failed}</Row>
          <Row label="Processing time">{formatDuration(result.processingMs)}</Row>
        </dl>

        {partial ? (
          <button
            type="button"
            onClick={downloadFailedRows}
            className="h-11 w-full rounded-xl border border-[#E1E4EE] text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
          >
            Download failed rows CSV
          </button>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/transactions")}
            className="h-12 flex-1 rounded-xl border border-[#E1E4EE] text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
          >
            View transactions
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Start another bulk payment
          </button>
        </div>
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
