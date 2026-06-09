"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, ExternalLink, PartyPopper, Share2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";

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

  if (!result || !amount || !recipient) {
    return null;
  }

  const order = result.order;

  async function copyOrderId() {
    try {
      await navigator.clipboard.writeText(String(order.merchant_order_id));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  async function shareReceipt() {
    if (!result || !recipient || !amount) return;
    const text = `Payment sent — ${amount.fiatAmount} ${amount.receiveCurrency} to ${recipient.name ?? recipient.email}. Order #${order.merchant_order_id}.`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "ElementPay receipt", text });
        return;
      } catch {
        /* fall through */
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

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="rounded-full bg-[#FFF0F3] p-6 text-[#FF6687]">
          <PartyPopper className="h-16 w-16" />
        </div>
      </div>

      <div className={cardClassName("space-y-5 p-6")}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#171D32]">Order created</h2>
          <p className="mt-2 text-sm text-[#7E8498]">
            We&apos;ve created an order for{" "}
            <span className="font-semibold text-[#1D243C]">
              {amount.fiatAmount} {amount.receiveCurrency}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-[#1D243C]">
              {recipient.name ?? recipient.email}
            </span>
          </p>
        </div>

        {order.checkout_url ? (
          <a
            href={order.checkout_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Complete on provider <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}

        <dl className="divide-y divide-[#EFF2F7] text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Order ID</dt>
            <dd className="flex items-center gap-2 font-medium text-[#1D243C]">
              <span>{order.merchant_order_id}</span>
              <button
                type="button"
                onClick={copyOrderId}
                aria-label="Copy order ID"
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
          {order.aggregator_order_id ? (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[#8E93A7]">Aggregator ref</dt>
              <dd className="font-mono text-[11px] text-[#4D556D]">
                {order.aggregator_order_id}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Order status</dt>
            <dd>
              <span className="inline-flex rounded-md border border-[#BFE9D2] bg-[#E8F8EF] px-2 py-1 text-[11px] font-medium text-[#1E9F72]">
                {order.status}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Submission time</dt>
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
            onClick={() => router.push(`/dashboard/transactions/${order.merchant_order_id}`)}
            className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            View order
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
