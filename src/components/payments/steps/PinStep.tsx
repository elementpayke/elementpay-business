"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, ShieldCheck, TriangleAlert, X } from "lucide-react";
import {
  acceptOrderQuote,
  OrderApiError,
  type OrderAcceptOut,
} from "@/lib/orders";
import { normalizeOrderError } from "@/lib/orderErrors";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";

// SECURITY NOTE: this step previously "verified" a PIN hardcoded to "0000" in
// client code, which any user could read or guess — it provided no protection
// while looking like it did. Until the backend exposes a real server-side
// authorization check (transaction PIN verified against a server-stored hash,
// or a Privy step-up/signing challenge), this modal is an explicit
// confirmation gate only and is honest about that in the UI.
//
// TODO(auth): when the backend ships a transaction-PIN / step-up endpoint,
// verify it here BEFORE calling acceptOrderQuote, and restore the PIN entry UI.

type PinStepProps = {
  quoteId: string;
  /** Dismiss the modal without authorizing. */
  onClose: () => void;
  /** Quote expired (410 on accept) — parent should re-quote. */
  onExpired: () => void;
};

export default function PinStep({ quoteId, onClose, onExpired }: PinStepProps) {
  const setResult = useSendPaymentStore((s) => s.setResult);
  const setError = useSendPaymentStore((s) => s.setError);

  const [submitting, setSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  // Close on Escape for accessibility.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  async function authorize() {
    if (submitting || !acknowledged) return;

    setSubmitting(true);
    try {
      const res: OrderAcceptOut = await acceptOrderQuote(quoteId);
      setResult(res); // sets phase → success
    } catch (err) {
      // ORDER_FLOW.md accept error branches.
      if (err instanceof OrderApiError) {
        if (err.status === 410) {
          // Quote expired — go re-quote with the same inputs.
          onExpired();
          return;
        }
        if (err.status === 409) {
          // Already accepted — if we know the order, treat it as created.
          const orderId = (err.body as { data?: { merchant_order_id?: number } })?.data
            ?.merchant_order_id;
          if (orderId != null) {
            setResult({
              merchant_order_id: orderId,
              quote_id: quoteId,
              provider: "",
              status: "processing",
              order: {
                order_id: "",
                order_type: "OffRamp",
                amount_fiat: "",
                currency: "",
                amount_crypto: null,
                crypto_currency: null,
                crypto_network: null,
                wallet_address: null,
                exchange_rate: null,
                psp_transaction_id: null,
              },
              payment_instructions: {
                type: "crypto_deposit",
                source: null,
                bank_info: null,
                reference: null,
                account_number: null,
                bank_name: null,
                account_holder_name: null,
                wallet_address: null,
                amount: null,
                currency: null,
                network: null,
                expires_at: null,
              },
            });
            return;
          }
        }
      }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Confirm payment"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-500">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-[#171D32]">Confirm payment</h2>
              <p className="text-xs text-[#8E93A7]">Review before you authorize</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-md p-1 text-[#8E93A7] transition hover:bg-[#F3F4F8] hover:text-[#4D556D] disabled:opacity-40"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#F2DCB3] bg-[#FFFAF0] p-3.5 text-xs text-[#8A6116]">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Authorizing creates the payout order at the quoted rate and cannot
            be undone from the dashboard. Make sure the amount and recipient
            account on the review screen are correct.
          </p>
        </div>

        <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs text-[#4D556D]">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            disabled={submitting}
            className="mt-0.5 h-4 w-4 rounded border-[#CBD1E0] accent-primary-500"
          />
          <span>
            I&apos;ve checked the recipient account and amount, and I authorize
            this payment.
          </span>
        </label>

        <button
          ref={confirmRef}
          type="button"
          onClick={() => void authorize()}
          disabled={submitting || !acknowledged}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Authorizing…
            </>
          ) : (
            "Authorize & send"
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="mt-2.5 h-11 w-full rounded-xl bg-[#F3F4F8] text-sm font-semibold text-[#4D556D] transition hover:bg-[#E9EBF2] disabled:opacity-40"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
