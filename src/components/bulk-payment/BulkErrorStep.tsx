"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { toFailedRowsCsv } from "@/lib/payments/bulkCsv";
import { useBulkPaymentStore } from "@/stores/bulkPaymentStore";

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

export default function BulkErrorStep() {
  const router = useRouter();
  const error = useBulkPaymentStore((s) => s.error);
  const parseResult = useBulkPaymentStore((s) => s.parseResult);
  const setPhase = useBulkPaymentStore((s) => s.setPhase);
  const reset = useBulkPaymentStore((s) => s.reset);

  const failedRows = parseResult?.rows.filter((row) => row.status === "invalid") ?? [];

  function downloadFailedRows() {
    if (failedRows.length === 0) return;
    triggerCsvDownload("bulk-failed-rows.csv", toFailedRowsCsv(failedRows));
  }

  return (
    <div className={cardClassName("space-y-5 p-6 sm:p-8")}>
      <div className="flex justify-center">
        <div className="rounded-full bg-[#FFECEA] p-4 text-[#E25555]">
          <AlertTriangle className="h-10 w-10" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#171D32]">Bulk payment failed</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#7E8498]">
          {error?.message ??
            "We couldn't complete this bulk transfer. No funds have left your wallet."}
        </p>
      </div>

      {failedRows.length > 0 ? (
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
          className="h-12 flex-1 rounded-xl border border-[#E1E4EE] text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
        >
          Back to dashboard
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Start over
        </button>
        {error?.retryable !== false ? (
          <button
            type="button"
            onClick={() => setPhase("payment-review")}
            className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Retry bulk transfer
          </button>
        ) : null}
      </div>
    </div>
  );
}
