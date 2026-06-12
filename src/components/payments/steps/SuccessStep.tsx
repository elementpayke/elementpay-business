"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, ExternalLink, PartyPopper, Share2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import CopyToast from "@/components/wallets/CopyToast";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";

export default function SuccessStep() {
  const router = useRouter();
  const { copy, toast } = useCopyToClipboard();

  const recipient = useSendPaymentStore((s) => s.recipient);
  const amount = useSendPaymentStore((s) => s.amount);
  const result = useSendPaymentStore((s) => s.result);
  const resetForNewPayment = useSendPaymentStore((s) => s.resetForNewPayment);

  if (!result || !amount || !recipient) {
    return null;
  }

  const orderId = result.merchant_order_id;
  const aggregatorOrderId = result.order?.order_id || null;
  const instructions = result.payment_instructions;

  async function shareReceipt() {
    if (!result || !recipient || !amount) return;
    const text = `Payment sent — ${amount.fiatAmount} ${amount.receiveCurrency} to ${amount.accountName}. Order #${orderId}.`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title: "ElementPay receipt", text });
        return;
      } catch {
        /* fall through to copy */
      }
    }
    void copy(text, "Receipt copied");
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
            to <span className="font-semibold text-[#1D243C]">{amount.accountName}</span>
          </p>
        </div>

        {/* OffRamp: the user must send crypto to a deposit address to settle. */}
        {instructions?.type === "crypto_deposit" ? (
          <div className="space-y-3 rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] p-4 text-sm text-[#4D556D]">
            <p className="font-semibold text-[#1A2138]">
              Send crypto to complete this payout
            </p>
            {instructions.wallet_address ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-[#ECEEF5] bg-white p-3">
                <span className="break-all font-mono text-xs text-[#1A2138]">
                  {instructions.wallet_address}
                </span>
                <button
                  type="button"
                  onClick={() => copy(instructions.wallet_address ?? "", "Address copied")}
                  aria-label="Copy deposit address"
                  className="shrink-0 text-[#7E8498] transition hover:text-primary-500"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            {instructions.amount && instructions.currency ? (
              <p className="text-xs">
                Amount:{" "}
                <span className="font-semibold text-[#1A2138]">
                  {instructions.amount} {instructions.currency}
                  {instructions.network ? ` (${instructions.network})` : ""}
                </span>
              </p>
            ) : null}
            {instructions.expires_at ? (
              <p className="text-xs">
                Window closes:{" "}
                <span className="font-semibold text-[#1A2138]">
                  {new Date(instructions.expires_at).toLocaleString()}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}

        <dl className="divide-y divide-[#EFF2F7] text-sm">
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Order ID</dt>
            <dd className="flex items-center gap-2 font-medium text-[#1D243C]">
              <span>{orderId}</span>
              <button
                type="button"
                onClick={() => copy(String(orderId), "Order ID copied")}
                aria-label="Copy order ID"
                className="rounded-md border border-[#E1E4EE] p-1.5 text-[#5C637A] transition hover:border-primary-300 hover:text-primary-700"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </dd>
          </div>
          {aggregatorOrderId ? (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[#8E93A7]">Aggregator ref</dt>
              <dd className="font-mono text-[11px] text-[#4D556D]">{aggregatorOrderId}</dd>
            </div>
          ) : null}
          {result.provider ? (
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-[#8E93A7]">Provider</dt>
              <dd className="font-medium capitalize text-[#1D243C]">{result.provider}</dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 py-3">
            <dt className="text-[#8E93A7]">Order status</dt>
            <dd>
              <span className="inline-flex items-center gap-1 rounded-md border border-[#BFE9D2] bg-[#E8F8EF] px-2 py-1 text-[11px] font-medium text-[#1E9F72]">
                <CheckCircle2 className="h-3 w-3" />
                {result.status}
              </span>
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void shareReceipt()}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-[#E1E4EE] text-sm font-semibold text-primary-700 transition hover:border-primary-300"
          >
            <Share2 className="h-4 w-4" /> Share receipt
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/transactions/${orderId}`)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
          >
            View order <ExternalLink className="h-4 w-4" />
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

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}
