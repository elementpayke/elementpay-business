"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Hourglass, Loader2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSendPaymentStore, type ProcessingStage } from "@/stores/sendPaymentStore";
import { getOrderStatus } from "@/lib/payments/service";

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 120_000;

const STAGES: { key: ProcessingStage; label: string }[] = [
  { key: "validating", label: "Validating recipient" },
  { key: "confirming-fee", label: "Confirming transaction fee" },
  { key: "initializing", label: "Initializing transfer to recipient" },
];

function stageIndex(stage: ProcessingStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

function formatAmount(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function ProcessingStep() {
  const router = useRouter();
  const recipient = useSendPaymentStore((s) => s.recipient);
  const amount = useSendPaymentStore((s) => s.amount);
  const stage = useSendPaymentStore((s) => s.processingStage);
  const pendingOrderId = useSendPaymentStore((s) => s.pendingOrderId);
  const setProcessingStage = useSendPaymentStore((s) => s.setProcessingStage);
  const setResult = useSendPaymentStore((s) => s.setResult);
  const setError = useSendPaymentStore((s) => s.setError);

  const startedAtRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!pendingOrderId) return;
    let cancelled = false;
    let timeoutId: number | null = null;
    if (startedAtRef.current === null) {
      startedAtRef.current = Date.now();
    }
    const startedAt = startedAtRef.current;

    async function poll() {
      if (cancelled || doneRef.current) return;
      if (!pendingOrderId) return;

      try {
        const snapshot = await getOrderStatus(pendingOrderId);
        if (cancelled) return;

        if (snapshot.status === "success" && snapshot.transactionId) {
          doneRef.current = true;
          setProcessingStage("done");
          setResult({
            transactionId: snapshot.transactionId,
            processingMs: Date.now() - startedAt,
            completedAt: Date.now(),
          });
          return;
        }

        if (snapshot.status === "failed") {
          doneRef.current = true;
          setError({
            code: "processing_failed",
            message: snapshot.failureReason ?? "Payment failed during processing",
            retryable: true,
          });
          return;
        }

        if (
          snapshot.status === "validating" ||
          snapshot.status === "confirming-fee" ||
          snapshot.status === "initializing"
        ) {
          setProcessingStage(snapshot.status);
        } else if (snapshot.status === "processing") {
          setProcessingStage("initializing");
        }

        if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
          doneRef.current = true;
          setError({
            code: "processing_timeout",
            message: "We couldn't confirm the transfer in time. Please check the transaction log.",
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
  }, [pendingOrderId, setProcessingStage, setResult, setError]);

  const activeIndex = stage === "done" ? STAGES.length : stageIndex(stage);

  return (
    <div className={cardClassName("space-y-6 p-6 sm:p-8")}>
      <div className="flex justify-center py-3">
        <div className="rounded-full bg-[#FFF4F6] p-5 text-[#E35D7A]">
          <Hourglass className="h-10 w-10 animate-pulse" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-semibold text-[#171D32]">Processing Your Payment...</h2>
        <p className="mt-2 text-sm text-[#7E8498]">
          Please wait while we process your payment of{" "}
          <span className="font-semibold text-[#1D243C]">
            {amount ? `${amount.sendCurrency} ${formatAmount(amount.sendAmount)}` : ""}
          </span>{" "}
          to <span className="font-semibold text-[#1D243C]">{recipient?.name ?? recipient?.email}</span>
        </p>
      </div>

      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#F0F2F7]">
        <div className="animate-processing-bar absolute inset-y-0 left-0 w-1/2 rounded-full bg-[linear-gradient(90deg,#413ACB_0%,#FF90A8_100%)]" />
      </div>

      <ul className="space-y-3">
        {STAGES.map((s, index) => {
          const complete = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li key={s.key} className="flex items-center gap-3 text-sm">
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
                {s.label}
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
