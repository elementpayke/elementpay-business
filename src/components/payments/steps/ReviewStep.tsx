"use client";

import { useMemo } from "react";
import { Clock3 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";

function formatUsd(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPhone(raw?: string): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  return raw;
}

export default function ReviewStep() {
  const recipient = useSendPaymentStore((s) => s.recipient);
  const amount = useSendPaymentStore((s) => s.amount);
  const reference = useSendPaymentStore((s) => s.reference);
  const setReference = useSendPaymentStore((s) => s.setReference);
  const setPhase = useSendPaymentStore((s) => s.setPhase);

  const { wallets } = useSelectedWallet();

  const payingWallet = useMemo(
    () =>
      wallets.find(
        (w) => w.address.toLowerCase() === amount?.sourceWalletAddress.toLowerCase(),
      ),
    [wallets, amount?.sourceWalletAddress],
  );

  if (!recipient || !amount) {
    return null;
  }

  const total = amount.sendAmount + amount.fee;

  return (
    <div className={cardClassName("space-y-5 p-5 sm:p-6")}>
      <div className="text-center">
        <p className="text-xs text-[#8E93A7]">You&apos;re about to send</p>
        <p className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-[#171D32]">
          {amount.sendCurrency} {formatUsd(amount.sendAmount)}
        </p>
        <p className="mt-1 text-xs font-medium text-tertiary-700">
          + Fees: {amount.sendCurrency} {formatUsd(amount.fee)}
        </p>
        <p className="mt-4 text-xs text-[#8E93A7]">to</p>
        <p className="mt-1 text-base font-semibold text-[#1D243C]">
          {recipient.name ?? recipient.email}
        </p>
        {recipient.name ? (
          <p className="mt-1 text-xs text-[#8E93A7]">{recipient.email}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-tertiary-200 bg-tertiary-50 px-4 py-3 text-xs font-medium text-tertiary-700">
        <Clock3 className="h-4 w-4" />
        <span>Your payment should be sent and delivered in about ~3 minutes</span>
      </div>

      <dl className="divide-y divide-[#EFF2F7] text-sm">
        <Row label="Recipient's country">
          <span className="inline-flex items-center gap-1.5">
            <span>🇰🇪</span>
            <span>{recipient.country}</span>
          </span>
        </Row>
        <Row label="Payment method">{recipient.paymentMethod}</Row>
        <Row label="Paying from">{payingWallet?.label ?? "Wallet"}</Row>
        <Row label="Phone number">{formatPhone(recipient.phoneNumber)}</Row>
        <Row label="Exchange rate">
          1 US Dollar = {amount.fxRate.toFixed(2)} Kenyan Shillings
        </Row>
        <Row label="Total debit amount">
          {amount.sendCurrency} {formatUsd(total)}
        </Row>
      </dl>

      <div>
        <label className="mb-2 block text-xs text-[#4D556D]">Reference (Optional)</label>
        <textarea
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setPhase("payment-amount")}
          className="h-12 flex-1 rounded-xl bg-primary-50 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          Back to payment amount
        </button>
        <button
          type="button"
          onClick={() => setPhase("pin-confirmation")}
          className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
        >
          Proceed to confirm payment
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
