"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, PartyPopper, Share2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";

function formatAmount(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}m ${seconds}s`;
}

export default function SuccessStep() {
  const router = useRouter();
  const recipient = useSendPaymentStore((s) => s.recipient);
  const amount = useSendPaymentStore((s) => s.amount);
  const result = useSendPaymentStore((s) => s.result);
  const resetForNewPayment = useSendPaymentStore((s) => s.resetForNewPayment);

  const [copied, setCopied] = useState(false);

  async function copyTxId() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.transactionId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function shareReceipt() {
    if (!result || !recipient || !amount) return;
    const text = `Payment Successful — ${amount.sendCurrency} ${formatAmount(
      amount.sendAmount,
    )} sent to ${recipient.name ?? recipient.email}. Transaction ${result.transactionId}.`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "ElementPay receipt", text });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  if (!result || !amount || !recipient) {
    return null;
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
          <h2 className="text-xl font-semibold text-[#171D32]">Payment Successful!</h2>
          <p className="mt-2 text-sm text-[#7E8498]">
            Your payment of{" "}
            <span className="font-semibold text-[#1D243C]">
              {amount.sendCurrency} {formatAmount(amount.sendAmount)}
            </span>{" "}
            has been sent to{" "}
            <span className="font-semibold text-[#1D243C]">
              {recipient.name ?? recipient.email}
            </span>
          </p>
        </div>

        <dl className="divide-y divide-[#EFF2F7] text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Transaction ID</dt>
            <dd className="flex items-center gap-2 font-medium text-[#1D243C]">
              <span>{result.transactionId}</span>
              <button
                type="button"
                onClick={copyTxId}
                aria-label="Copy transaction ID"
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
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Transaction status</dt>
            <dd>
              <span className="inline-flex rounded-md border border-[#BFE9D2] bg-[#E8F8EF] px-2 py-1 text-[11px] font-medium text-[#1E9F72]">
                Successful
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Transaction processing time</dt>
            <dd className="font-medium text-[#1D243C]">{formatDuration(result.processingMs)}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={shareReceipt}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E1E4EE] text-sm font-semibold text-primary-700 transition hover:border-primary-300"
          >
            <Share2 className="h-4 w-4" /> Share receipt
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => resetForNewPayment()}
            className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Send another payment
          </button>
        </div>
      </div>
    </div>
  );
}
