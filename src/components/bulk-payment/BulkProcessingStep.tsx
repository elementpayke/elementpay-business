"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Hourglass, Loader2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { finalizeBulkBatch, getBulkBatchSnapshot } from "@/lib/payments/bulkService";
import type { BulkProcessingStage } from "@/lib/payments/bulkTypes";
import { useBulkPaymentStore } from "@/stores/bulkPaymentStore";

const POLL_INTERVAL_MS = 1200;
const POLL_TIMEOUT_MS = 180_000;

const STAGES: { key: BulkProcessingStage; label: string }[] = [
  { key: "validating-batch", label: "Validating batch payload" },
  { key: "reserving-fees", label: "Reserving fees and limits" },
  { key: "initializing-queue", label: "Initializing recipients queue" },
  { key: "sending-transfers", label: "Sending transfers in background" },
  { key: "finalizing", label: "Finalizing settlement summary" },
];

function stageIndex(stage: BulkProcessingStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

export default function BulkProcessingStep() {
  const router = useRouter();
  const batchId = useBulkPaymentStore((s) => s.batchId);
  const progress = useBulkPaymentStore((s) => s.progress);
  const setProgress = useBulkPaymentStore((s) => s.setProgress);
  const setResult = useBulkPaymentStore((s) => s.setResult);
  const setError = useBulkPaymentStore((s) => s.setError);

  const startedAtRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!batchId) return;
    let cancelled = false;
    let timeoutId: number | null = null;
    if (startedAtRef.current === null) startedAtRef.current = Date.now();
    const startedAt = startedAtRef.current;

    async function poll() {
      if (cancelled || doneRef.current) return;
      if (!batchId) return;

      try {
        const snapshot = await getBulkBatchSnapshot(batchId);
        if (cancelled) return;

        setProgress(snapshot);

        if (snapshot.stage === "done") {
          doneRef.current = true;
          const result = await finalizeBulkBatch(batchId, startedAt);
          if (cancelled) return;
          setResult(result);
          return;
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          doneRef.current = true;
          setError({
            code: "processing_timeout",
            message: "We couldn't confirm the bulk transfer in time. Please check the transactions log.",
            retryable: false,
          });
          return;
        }
      } catch (err) {
        if (cancelled) return;
        doneRef.current = true;
        const message = err instanceof Error ? err.message : "Polling failed";
        setError({ code: "poll_failed", message, retryable: true });
        return;
      }

      if (!cancelled && !doneRef.current) {
        timeoutId = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [batchId, setProgress, setResult, setError]);

  const activeIndex = progress ? stageIndex(progress.stage) : 0;
  const totalRecipients = progress?.totalRecipients ?? 0;
  const processed = progress?.processed ?? 0;
  const successful = progress?.successful ?? 0;
  const failed = progress?.failed ?? 0;
  const pending = progress?.pending ?? totalRecipients;

  return (
    <div className={cardClassName("space-y-6 p-6 sm:p-8")}>
      <div className="flex justify-center py-3">
        <div className="rounded-full bg-[#FFF4F6] p-5 text-[#E35D7A]">
          <Hourglass className="h-10 w-10 animate-pulse" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#171D32]">Processing bulk payment…</h2>
        <p className="mt-2 text-sm text-[#7E8498]">
          Sending transfers to{" "}
          <span className="font-semibold text-[#1D243C]">{totalRecipients} recipient{totalRecipients === 1 ? "" : "s"}</span>.
          You can safely navigate away — the batch continues in the background.
        </p>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#F0F2F7]">
        <div className="animate-processing-bar absolute inset-y-0 left-0 w-1/2 rounded-full bg-[linear-gradient(90deg,#413ACB_0%,#FF90A8_100%)]" />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Counter label="Processed" value={`${processed}/${totalRecipients}`} />
        <Counter label="Successful" value={successful.toString()} tone="valid" />
        <Counter label="Failed" value={failed.toString()} tone={failed > 0 ? "warning" : "neutral"} />
        <Counter label="Pending" value={pending.toString()} />
      </div>

      <ul className="space-y-3">
        {STAGES.map((stage, index) => {
          const complete = index < activeIndex || progress?.stage === "done";
          const active = !complete && index === activeIndex;
          return (
            <li key={stage.key} className="flex items-center gap-3 text-sm">
              {complete ? (
                <CheckCircle2 className="h-5 w-5 text-[#1E9F72]" />
              ) : active ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              ) : (
                <Circle className="h-5 w-5 text-[#D1D5E0]" />
              )}
              <span
                className={
                  complete
                    ? "text-[#1D243C]"
                    : active
                    ? "font-medium text-[#1D243C]"
                    : "text-[#8E93A7]"
                }
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => router.push("/dashboard")}
        className="h-12 w-full rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
      >
        Back to dashboard
      </button>
    </div>
  );
}

function Counter({
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
    <div className="rounded-xl border border-[#EFF1F7] bg-[#FAFBFE] p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#8D92A6]">{label}</p>
      <p className={`mt-1 text-base font-semibold ${valueTone}`}>{value}</p>
    </div>
  );
}
