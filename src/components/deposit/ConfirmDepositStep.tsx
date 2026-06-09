"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Wallet2 } from "lucide-react";
import {
  acceptOrderQuote,
  createOrderQuote,
  type OrderQuoteOnRampIn,
} from "@/lib/orders";
import { normalizeOrderError } from "@/lib/orderErrors";
import QuoteErrorPanel from "@/components/orders/QuoteErrorPanel";
import { COUNTRIES } from "@/lib/countries";
import { useDepositStore } from "@/stores/depositStore";

const METHOD_LABELS: Record<string, string> = {
  momo: "Mobile money",
  bank: "Bank transfer",
};

function formatAmount(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (hours > 0 || minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

function formatExpiryEat(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleTimeString("en-US", {
    timeZone: "Africa/Nairobi",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Normalize a raw phone input to E.164. The deposit form accepts "0712...",
 * "+254712...", "254712..." etc. Aggregator / M-Pesa upstream require E.164,
 * so coerce on submit using the deposit country's dial code.
 */
function toE164(raw: string, country: string | null): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  // Resolve the dial code from the shared country table so any catalog
  // corridor works, not just a hardcoded handful.
  const dialCode =
    (country && COUNTRIES.find((c) => c.code === country)?.dialCode.replace(/\D/g, "")) || "";
  if (!dialCode) return digits ? `+${digits}` : "";
  const local = digits.startsWith(dialCode)
    ? digits
    : `${dialCode}${digits.replace(/^0+/, "")}`;
  return `+${local}`;
}

export default function ConfirmDepositStep() {
  const {
    selectedCurrency,
    selectedCountry,
    selectedWalletAddress,
    selectedWalletLabel,
    selectedTokenAddress,
    amountFiat,
    paymentMethod,
    selectedProvider,
    phoneNumber,
    accountName,
    quote,
    quoteLoading,
    quoteError,
    setQuote,
    setQuoteLoading,
    setQuoteError,
    setPhase,
    setOrderResult,
    setErrorMessage,
  } = useDepositStore();

  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inflightRef = useRef(false);

  const requestQuote = useCallback(async () => {
    if (inflightRef.current) return;
    if (
      !selectedWalletAddress ||
      !selectedTokenAddress ||
      !selectedCurrency ||
      !selectedCountry ||
      !paymentMethod ||
      amountFiat <= 0
    ) {
      return;
    }
    inflightRef.current = true;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const trimmedName = accountName.trim();
      const phoneE164 = toE164(phoneNumber, selectedCountry);
      // PII (`recipient`) is intentionally omitted — the backend fills the
      // customer's identity from the business's KYC/KYB on file, so the quote
      // only needs amount, token/currency/country, the destination wallet and
      // the funding rail (`source`).
      const payload: OrderQuoteOnRampIn = {
        order_type: "OnRamp",
        token: selectedTokenAddress,
        currency: selectedCurrency,
        country: selectedCountry,
        local_amount: String(amountFiat),
        wallet_address: selectedWalletAddress,
        source: {
          accountType: paymentMethod === "momo" ? "momo" : "bank",
          accountNumber: phoneE164,
          accountName: trimmedName,
          // TODO(provider): send `selectedProvider` (id/code) once the backend
          // quote accepts an explicit pay-in provider field.
        },
      };
      const res = await createOrderQuote(payload);
      setQuote(res);
    } catch (err) {
      setQuoteError(normalizeOrderError(err, "deposit"));
      setQuote(null);
    } finally {
      setQuoteLoading(false);
      inflightRef.current = false;
    }
  }, [
    amountFiat,
    paymentMethod,
    selectedCurrency,
    selectedCountry,
    selectedTokenAddress,
    selectedWalletAddress,
    phoneNumber,
    accountName,
    setQuote,
    setQuoteError,
    setQuoteLoading,
  ]);

  useEffect(() => {
    void requestQuote();
  }, [requestQuote]);

  // 1s ticker — only running while we have a non-expired quote.
  useEffect(() => {
    if (!quote?.expires_at) return;
    const expiryMs = new Date(quote.expires_at).getTime();
    if (!Number.isFinite(expiryMs)) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quote?.expires_at]);

  const expiresAtMs = quote?.expires_at
    ? new Date(quote.expires_at).getTime()
    : null;
  const remainingMs =
    expiresAtMs && Number.isFinite(expiresAtMs) ? expiresAtMs - now : null;
  const isExpired = remainingMs !== null && remainingMs <= 0;

  // Auto-refetch once the current quote crosses its expiry.
  useEffect(() => {
    if (!isExpired) return;
    if (quoteLoading) return;
    void requestQuote();
  }, [isExpired, quoteLoading, requestQuote]);

  async function handleConfirm() {
    if (!quote?.quote_id) return;
    setSubmitting(true);
    try {
      const res = await acceptOrderQuote(quote.quote_id);
      setOrderResult(res);
      setPhase("success");
    } catch (err) {
      setErrorMessage(normalizeOrderError(err, "deposit").userMessage);
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }

  const methodLabel = paymentMethod ? METHOD_LABELS[paymentMethod] : "—";
  const userPays = quote?.amounts.user_pays;
  const userReceives = quote?.amounts.user_receives;
  const fees = quote?.amounts.fees;
  const feeLines: Array<{ label: string; value: string }> = [];
  if (fees && typeof fees === "object") {
    for (const [k, v] of Object.entries(fees)) {
      if (v == null) continue;
      feeLines.push({
        label: k.replace(/_/g, " "),
        value: String(v),
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <span className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-primary-100 text-primary-500">
          <Wallet2 className="h-16 w-16" />
        </span>
      </div>

      <div className="mx-auto max-w-[560px] rounded-xl border border-[#ECEEF5] bg-white p-8">
        <p className="text-center text-sm text-[#7E8498]">
          You&apos;re about to deposit
        </p>
        <p className="mt-2 text-center text-3xl font-bold text-[#1A2138]">
          {`${selectedCurrency ?? ""} ${amountFiat.toLocaleString("en-US")}`.trim()}
        </p>
        <p className="mt-1 text-center text-sm text-[#7E8498]">into</p>
        <p className="text-center text-sm font-semibold text-[#1A2138]">
          {selectedWalletLabel ?? "Wallet"}
        </p>
        <p className="mt-1 text-center text-sm text-[#7E8498]">via</p>
        <p className="text-center text-sm font-semibold text-[#1A2138]">
          {selectedProvider?.name
            ? `${methodLabel} · ${selectedProvider.name}`
            : methodLabel}
        </p>

        {quoteLoading ? (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#ECEEF5] bg-[#FAFBFE] py-4 text-sm text-[#4D556D]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Fetching live FX and fees…
          </div>
        ) : null}

        {quoteError && !quoteLoading ? (
          <div className="mt-6">
            <QuoteErrorPanel
              error={quoteError}
              onRetry={() => void requestQuote()}
              isRetrying={quoteLoading}
            />
          </div>
        ) : null}

        {quote && !quoteLoading ? (
          <dl className="mt-6 space-y-3 text-sm">
            {quote.amounts.rate ? (
              <Row label="Exchange rate">
                1 {userReceives?.currency ?? "USDC"} ={" "}
                {formatAmount(quote.amounts.rate)}{" "}
                {quote.amounts.rate_currency ?? userPays?.currency ?? ""}
              </Row>
            ) : null}
            {userPays ? (
              <Row label="You pay">
                {`${userPays.currency} ${formatAmount(userPays.amount)}`}
              </Row>
            ) : null}
            {userReceives ? (
              <Row label="You will receive">
                {`${formatAmount(userReceives.amount)} ${userReceives.currency}${userReceives.network ? ` (${userReceives.network})` : ""}`}
              </Row>
            ) : null}
            {feeLines.map((f) => (
              <Row key={f.label} label={f.label}>
                {f.value}
              </Row>
            ))}
            {remainingMs !== null && quote?.expires_at ? (
              <Row label="Quote expires at">
                <span
                  className={
                    remainingMs <= 30_000
                      ? "text-[#A1352F]"
                      : "text-[#1A2138]"
                  }
                >
                  {formatExpiryEat(quote.expires_at)} EAT{" "}
                  <span className="text-[#7E8498]">
                    [{formatRemaining(remainingMs)}]
                  </span>
                </span>
              </Row>
            ) : null}
          </dl>
        ) : null}

        {quote?.instructions?.note && !quoteLoading ? (
          <div className="mt-4 rounded-lg border border-primary-200 bg-primary-100/40 p-3 text-xs text-[#4D556D]">
            {quote.instructions.note}
          </div>
        ) : null}

        {isExpired && !quoteLoading ? (
          <div className="mt-4 rounded-lg border border-[#F5B5B3] bg-[#FFF4F3] p-3 text-xs text-[#A1352F]">
            This quote has expired. Refreshing for a new rate…
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPhase("deposit-details")}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-200 text-sm font-semibold text-primary-500 transition hover:bg-primary-100/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!quote || submitting || quoteLoading || isExpired}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Confirm deposit"
            )}
          </button>
        </div>
      </div>
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
    <div className="flex items-center justify-between gap-4 border-b border-[#EFF2F7] pb-2 last:border-b-0">
      <dt className="text-[#7E8498] capitalize">{label}</dt>
      <dd className="text-right font-medium text-[#1A2138]">{children}</dd>
    </div>
  );
}
