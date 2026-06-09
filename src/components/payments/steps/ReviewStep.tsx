"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";
import {
  createOrder,
  quoteOrder,
  type CashoutType,
  type FiatPayloadIn,
} from "@/lib/orders";
import { normalizeOrderError } from "@/lib/orderErrors";
import QuoteErrorPanel from "@/components/orders/QuoteErrorPanel";

function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export default function ReviewStep() {
  const recipient = useSendPaymentStore((s) => s.recipient);
  const amount = useSendPaymentStore((s) => s.amount);
  const reference = useSendPaymentStore((s) => s.reference);
  const quote = useSendPaymentStore((s) => s.quote);
  const quoteLoading = useSendPaymentStore((s) => s.quoteLoading);
  const quoteError = useSendPaymentStore((s) => s.quoteError);
  const setReference = useSendPaymentStore((s) => s.setReference);
  const setPhase = useSendPaymentStore((s) => s.setPhase);
  const setQuote = useSendPaymentStore((s) => s.setQuote);
  const setQuoteLoading = useSendPaymentStore((s) => s.setQuoteLoading);
  const setQuoteError = useSendPaymentStore((s) => s.setQuoteError);
  const setResult = useSendPaymentStore((s) => s.setResult);
  const setError = useSendPaymentStore((s) => s.setError);

  const { wallets } = useSelectedWallet();
  const [submitting, setSubmitting] = useState(false);
  const fetchedRef = useRef(false);

  const payingWallet = useMemo(
    () =>
      wallets.find(
        (w) => w.address.toLowerCase() === amount?.sourceWalletAddress.toLowerCase(),
      ),
    [wallets, amount?.sourceWalletAddress],
  );

  const requestQuote = useCallback(async () => {
    if (!recipient || !amount) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const res = await quoteOrder({
        amount_fiat: String(amount.fiatAmount),
        token: amount.tokenAddress,
        order_type: 1,
        currency: amount.receiveCurrency,
        wallet_address: amount.sourceWalletAddress,
      });
      setQuote(res);
    } catch (err) {
      setQuoteError(normalizeOrderError(err, "payment"));
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [recipient, amount, setQuote, setQuoteError, setQuoteLoading]);

  useEffect(() => {
    if (fetchedRef.current) return;
    if (!recipient || !amount) return;
    fetchedRef.current = true;
    void requestQuote();
  }, [recipient, amount, requestQuote]);

  if (!recipient || !amount) {
    return null;
  }

  async function handleConfirm() {
    if (!quote || !recipient || !amount) return;
    setSubmitting(true);
    const startedAt = Date.now();
    try {
      const cashoutType: CashoutType =
        recipient.accountType === "momo" ? "PHONE" : "BANK";
      const fiat: FiatPayloadIn = {
        amount_fiat: String(amount.fiatAmount),
        cashout_type: cashoutType,
        currency: amount.receiveCurrency,
        reference: reference.trim() || undefined,
        narrative: reference.trim()
          ? undefined
          : `Send ${amount.receiveCurrency} ${amount.fiatAmount} to ${recipient.name ?? recipient.email}`,
      };
      if (cashoutType === "PHONE") {
        fiat.phone_number = recipient.accountNumber.trim() || undefined;
      } else {
        fiat.account_number = recipient.accountNumber.trim() || undefined;
        fiat.bank_code = recipient.bankCode?.trim() || undefined;
        fiat.phone_number = recipient.bankPhoneNumber?.trim() || undefined;
      }
      const metadata: Record<string, string> = {
        recipient_email: recipient.email,
        recipient_country: recipient.country,
      };
      if (recipient.name) metadata.recipient_name = recipient.name;
      fiat.metadata = metadata;

      const order = await createOrder({
        user_address: amount.sourceWalletAddress,
        token: amount.tokenAddress,
        order_type: 1,
        fiat_payload: fiat,
      });
      setResult({
        order,
        processingMs: Date.now() - startedAt,
        completedAt: Date.now(),
      });
    } catch (err) {
      const normalized = normalizeOrderError(err, "payment");
      setError({
        code: normalized.kind,
        message: normalized.userMessage,
        retryable: normalized.retryable,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cardClassName("space-y-5 p-5 sm:p-6")}>
      <div className="text-center">
        <p className="text-xs text-[#8E93A7]">Recipient will receive</p>
        <p className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-[#171D32]">
          {`${formatNumber(amount.fiatAmount)} ${amount.receiveCurrency}`}
        </p>
        <p className="mt-4 text-xs text-[#8E93A7]">to</p>
        <p className="mt-1 text-base font-semibold text-[#1D243C]">
          {recipient.name ?? recipient.email}
        </p>
        <p className="mt-1 text-xs text-[#8E93A7]">{recipient.email}</p>
      </div>

      {quoteLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-[#ECEEF5] bg-[#FAFBFE] py-4 text-sm text-[#4D556D]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching live rate and fees…
        </div>
      ) : null}

      {quoteError && !quoteLoading ? (
        <QuoteErrorPanel
          error={quoteError}
          onRetry={() => void requestQuote()}
          isRetrying={quoteLoading}
        />
      ) : null}

      <dl className="divide-y divide-[#EFF2F7] text-sm">
        <Row label="Recipient&apos;s country">{recipient.country}</Row>
        <Row label="Payment method">{recipient.paymentMethod}</Row>
        <Row label="Paying from">{payingWallet?.label ?? "Wallet"}</Row>
        <Row label="Recipient account">{recipient.accountNumber}</Row>
        {quote ? (
          <>
            <Row label="Exchange rate">
              1 USDC = {formatNumber(quote.effective_rate)} {quote.currency}
            </Row>
            <Row label="You will spend">
              {`${formatNumber(quote.required_token_amount)} ${amount.tokenSymbol}`}
            </Row>
            <Row label="Service fee">
              {`${quote.currency} ${formatNumber(quote.fee_amount)}`}
            </Row>
          </>
        ) : null}
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
          onClick={handleConfirm}
          disabled={!quote || quoteLoading || submitting}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Confirm payment"
          )}
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
