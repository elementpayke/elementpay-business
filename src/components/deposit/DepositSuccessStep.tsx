"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Smartphone, Wallet2 } from "lucide-react";
import CopyToast from "@/components/wallets/CopyToast";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import { useDepositStore } from "@/stores/depositStore";
import ReceivingAccountCard from "./ReceivingAccountCard";

export default function DepositSuccessStep() {
  const router = useRouter();
  const { copy, toast } = useCopyToClipboard();
  const {
    selectedCurrency,
    selectedWalletLabel,
    amountFiat,
    paymentMethod,
    selectedProvider,
    orderResult,
  } = useDepositStore();

  const orderId = orderResult?.merchant_order_id ?? null;
  const aggregatorOrderId = orderResult?.order?.order_id ?? null;
  const instructions = orderResult?.payment_instructions ?? null;

  // Bank pay-in: the receiving-account details come from the accept-quote
  // response (`payment_instructions`). Prefer those; only fall back to
  // anticipated details if the backend returned an incomplete payload.
  const showBankReceivingCard =
    paymentMethod === "bank" &&
    selectedProvider !== null &&
    instructions?.type !== "crypto_deposit" &&
    instructions?.type !== "momo";
  const bankReceiving = showBankReceivingCard
    ? (() => {
        const hasRealDetails = Boolean(
          instructions?.account_number || instructions?.bank_name,
        );
        return {
          details: {
            account_name:
              instructions?.account_holder_name ?? "ElementPay Collections",
            account_number: instructions?.account_number ?? "0000000000",
            bank_name: instructions?.bank_name ?? selectedProvider!.name,
            reference:
              instructions?.reference ??
              (orderId !== null ? `ELP-${orderId}` : "ELP-<ORDER_ID>"),
          },
          isFallback: !hasRealDetails,
        };
      })()
    : null;

  const amountDisplay = `${selectedCurrency ?? ""} ${amountFiat.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`.trim();

  function viewDetails() {
    if (orderId !== null) {
      router.push(`/dashboard/transactions/${orderId}`);
    } else {
      router.push("/dashboard/transactions");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <span className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-tertiary-100 text-tertiary-500">
          <Wallet2 className="h-16 w-16" />
        </span>
      </div>

      <div className="mx-auto max-w-[560px] rounded-xl border border-[#ECEEF5] bg-white p-8 text-center">
        <p className="text-2xl font-bold text-[#1A2138]">Order created</p>
        <p className="mt-2 text-sm text-[#7E8498]">
          We&apos;re processing your deposit of
        </p>
        <p className="mt-1 text-2xl font-bold text-[#1A2138]">{amountDisplay}</p>
        <p className="mt-1 text-sm text-[#7E8498]">
          into{" "}
          <span className="font-semibold text-[#1A2138]">
            {selectedWalletLabel ?? "Wallet"}
          </span>
        </p>

        {bankReceiving ? (
          <div className="mt-6 text-left">
            <ReceivingAccountCard
              details={bankReceiving.details}
              isFallback={bankReceiving.isFallback}
            />
          </div>
        ) : instructions?.type === "momo" ? (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#BFE9D2] bg-[#F1FBF5] p-4 text-left text-sm text-[#1E5C3F]">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p>
                {selectedProvider?.name
                  ? `Check your phone for the ${selectedProvider.name} prompt and approve it to complete the deposit. `
                  : "Check your phone for the payment prompt and approve it to complete the deposit. "}
                Your wallet will be credited once payment confirms.
              </p>
              {instructions.source ? (
                <p className="text-xs text-[#1E5C3F]/80">
                  Paying from:{" "}
                  <span className="font-medium">
                    {String(
                      (instructions.source as Record<string, unknown>)
                        .accountNumber ?? "",
                    )}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        ) : instructions?.type === "crypto_deposit" ? (
          <div className="mt-6 space-y-3 rounded-lg border border-[#ECEEF5] bg-[#FAFBFE] p-4 text-left text-sm text-[#4D556D]">
            <p className="font-semibold text-[#1A2138]">
              Send crypto to complete the deposit
            </p>
            {instructions.wallet_address ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-[#ECEEF5] bg-white p-3">
                <span className="break-all font-mono text-xs text-[#1A2138]">
                  {instructions.wallet_address}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copy(
                      instructions.wallet_address ?? "",
                      "Address copied",
                    )
                  }
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
        ) : (
          <div className="mt-6 rounded-lg border border-[#ECEEF5] bg-[#FAFBFE] p-4 text-left text-sm text-[#4D556D]">
            Follow the payment instructions to complete the transfer. Your
            wallet will be credited once funds are received.
          </div>
        )}

        <hr className="my-6 border-t border-[#ECEEF5]" />

        <dl className="space-y-3 text-left">
          <Row label="Order ID">
            <span className="flex items-center gap-2">
              <span className="font-mono text-sm text-[#1A2138]">
                {orderId !== null ? String(orderId) : "—"}
              </span>
              {orderId !== null ? (
                <button
                  type="button"
                  onClick={() => copy(String(orderId), "Order ID copied")}
                  aria-label="Copy order ID"
                  className="text-[#7E8498] transition hover:text-primary-500"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </span>
          </Row>
          {aggregatorOrderId ? (
            <Row label="Aggregator ref">
              <span className="font-mono text-[11px] text-[#4D556D]">
                {aggregatorOrderId}
              </span>
            </Row>
          ) : null}
          <Row label="Status">
            <span className="inline-flex items-center gap-1 rounded-md border border-[#BFE9D2] bg-[#E8F8EF] px-2 py-1 text-[11px] font-medium text-[#1E9F72]">
              <CheckCircle2 className="h-3 w-3" />
              {orderResult?.status ?? "processing"}
            </span>
          </Row>
        </dl>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-200 text-sm font-semibold text-primary-500 transition hover:bg-primary-100/40"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={viewDetails}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
          >
            View order
          </button>
        </div>
      </div>

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-[#7E8498]">{label}</dt>
      <dd className="text-sm text-[#1A2138]">{children}</dd>
    </div>
  );
}
