"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";
import {
  createOrderQuote,
  type OrderQuoteOffRampIn,
  type OrderQuoteOut,
} from "@/lib/orders";
import { fetchExchangeRates } from "@/lib/dashboard/api";
import { normalizeOrderError } from "@/lib/orderErrors";
import QuoteErrorPanel from "@/components/orders/QuoteErrorPanel";
import PinStep from "@/components/payments/steps/PinStep";
import { useAuth } from "@/lib/AuthContext";

// Yellow Card's OffRamp corridor (KE, NG, ZA, etc.) only accepts Polygon USDT
// in the partner-quote contract — see MBOKA_PARTNER_ORDER_INTEGRATION.md.
// The dashboard's source wallet may hold Base USDC, but the quote+accept call
// must use Polygon USDT or the aggregator 400s on corridor/asset mismatch.
// TODO: once backend confirms multi-asset OffRamp support, derive this from
// the source wallet instead of hardcoding.
const OFFRAMP_ASSET_TOKEN = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";

// Discovery probe amount when public FX is unavailable. 1 USDC sits below
// most local-corridor minimums (≈130 KES on KE), so the aggregator 400s.
// 10 ≈ $10 ≈ 1,300 KES which clears the typical minimum.
const PROBE_CRYPTO_AMOUNT = "10";

function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return String(value);
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/** Format a USDC amount for the quote payload (USDC has 6 decimals). */
function toCryptoAmount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Couldn't derive the USDC amount for this payment.");
  }
  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

/** Achieved-vs-target tolerance before we re-quote once with a correction. */
const FIAT_TOLERANCE = 0.01; // 1%

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

  const { wallets } = useSelectedWallet();
  const { user, business } = useAuth();
  const [pinOpen, setPinOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inflightRef = useRef(false);

  const payingWallet = useMemo(
    () =>
      wallets.find(
        (w) => w.address.toLowerCase() === amount?.sourceWalletAddress.toLowerCase(),
      ),
    [wallets, amount?.sourceWalletAddress],
  );

  const requestQuote = useCallback(async () => {
    if (inflightRef.current) return;
    if (!recipient || !amount) return;
    inflightRef.current = true;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      // OffRamp quote: crypto in, fiat out. Destination is the account the
      // user entered on step 2; sender block is the authenticated business so
      // the aggregator has a customer identity (Yellow Card OffRamp expects
      // one even when KYB fills the rest). For bank payouts `networkId` (the
      // institution id chosen on step 1) tells the aggregator which bank to
      // route to.
      //
      // NOTE: the asset is forced to Polygon USDT — the only OffRamp asset
      // Yellow Card's KE/NG/etc. corridors accept on the partner contract.
      // See OFFRAMP_ASSET_TOKEN above.
      const quoteFor = (cryptoAmount: string): Promise<OrderQuoteOut> => {
        const payload: OrderQuoteOffRampIn = {
          order_type: "OffRamp",
          token: OFFRAMP_ASSET_TOKEN,
          currency: amount.receiveCurrency,
          country: recipient.countryCode,
          crypto_amount: cryptoAmount,
          refund_address: amount.refundAddress,
          destination: {
            accountType: recipient.accountType,
            accountNumber: amount.accountNumber,
            accountName: amount.accountName,
            ...(recipient.accountType === "bank" && recipient.bankNetworkId
              ? { networkId: recipient.bankNetworkId }
              : {}),
            countryCode: recipient.countryCode,
          },
          sender: {
            name: business?.name ?? business?.legal_name ?? undefined,
            country: business?.country ?? recipient.countryCode,
            email: user?.email,
          },
        };
        return createOrderQuote(payload);
      };

      // The OffRamp quote API is denominated in crypto, but the user typed the
      // fiat amount the recipient should receive. Derive the USDC amount:
      //   1. Estimate a rate — public FX snapshot first (USD base ≈ USDC),
      //      falling back to a 1-USDC discovery quote whose `user_receives`
      //      reflects the corridor's effective (fee-inclusive) rate.
      //   2. Quote at fiatTarget / rate.
      //   3. If the achieved fiat is off by more than 1%, re-quote once with a
      //      proportional correction. The displayed quote is the source of
      //      truth for both sides of the trade.
      const fiatTarget = amount.fiatAmount;

      let rate: number | null = null;
      try {
        const fx = await fetchExchangeRates();
        const r = fx?.rates?.[amount.receiveCurrency];
        if (typeof r === "number" && r > 0) rate = r;
      } catch {
        // Public FX snapshot unavailable — fall through to a discovery quote.
      }

      if (rate === null) {
        const probe = await quoteFor(PROBE_CRYPTO_AMOUNT);
        const achieved = Number(probe.amounts.user_receives.amount);
        const indicative = Number(probe.amounts.rate ?? 0);
        // achieved is user_receives for the probe crypto amount, so divide
        // to get the per-unit rate.
        const probeUnits = Number(PROBE_CRYPTO_AMOUNT);
        rate =
          achieved > 0 && probeUnits > 0
            ? achieved / probeUnits
            : indicative > 0
              ? indicative
              : null;
        if (rate === null) {
          throw new Error(
            "Couldn't determine the exchange rate for this corridor. Please try again.",
          );
        }
      }

      let res = await quoteFor(toCryptoAmount(fiatTarget / rate));

      const achievedFiat = Number(res.amounts.user_receives.amount);
      if (
        achievedFiat > 0 &&
        Math.abs(achievedFiat - fiatTarget) / fiatTarget > FIAT_TOLERANCE
      ) {
        const quotedCrypto = Number(res.amounts.user_pays.amount);
        if (quotedCrypto > 0) {
          res = await quoteFor(
            toCryptoAmount(quotedCrypto * (fiatTarget / achievedFiat)),
          );
        }
      }

      setQuote(res);
    } catch (err) {
      setQuoteError(normalizeOrderError(err, "payment"));
      setQuote(null);
    } finally {
      setQuoteLoading(false);
      inflightRef.current = false;
    }
  }, [recipient, amount, setQuote, setQuoteError, setQuoteLoading]);

  // Fetch a quote on entry and whenever the upstream inputs change (setAmount
  // clears the quote, so an edit → back here re-quotes automatically).
  useEffect(() => {
    if (quote || quoteLoading || quoteError) return;
    void requestQuote();
  }, [quote, quoteLoading, quoteError, requestQuote]);

  // 1s ticker while a quote with an expiry is live.
  useEffect(() => {
    if (!quote?.expires_at) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [quote?.expires_at]);

  const expiresAtMs = quote?.expires_at ? new Date(quote.expires_at).getTime() : null;
  const remainingMs =
    expiresAtMs && Number.isFinite(expiresAtMs) ? expiresAtMs - now : null;
  const isExpired = remainingMs !== null && remainingMs <= 0;

  if (!recipient || !amount) {
    return null;
  }

  const userPays = quote?.amounts.user_pays;
  const userReceives = quote?.amounts.user_receives;
  const fees = quote?.amounts.fees;
  const feeLines: Array<{ label: string; value: string }> = [];
  if (fees && typeof fees === "object") {
    for (const [k, v] of Object.entries(fees)) {
      if (v == null) continue;
      feeLines.push({ label: k.replace(/_/g, " "), value: String(v) });
    }
  }

  return (
    <div className={cardClassName("space-y-5 p-5 sm:p-6")}>
      <div className="text-center">
        <p className="text-xs text-[#8E93A7]">Recipient will receive</p>
        {/* The live quote is the source of truth — prefer its fiat leg over the
            typed target once it lands. */}
        <p className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-[#171D32]">
          {userReceives
            ? `${formatNumber(userReceives.amount)} ${userReceives.currency}`
            : `${formatNumber(amount.fiatAmount)} ${amount.receiveCurrency}`}
        </p>
        <p className="mt-4 text-xs text-[#8E93A7]">to</p>
        <p className="mt-1 text-base font-semibold text-[#1D243C]">{amount.accountName}</p>
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
        <Row label="Payment method">
          {recipient.bankName
            ? `${recipient.paymentMethod} · ${recipient.bankName}`
            : recipient.paymentMethod}
        </Row>
        <Row label="Paying from">{payingWallet?.label ?? "Wallet"}</Row>
        <Row label="Recipient account">{amount.accountNumber}</Row>
        {quote ? (
          <>
            {quote.amounts.rate ? (
              <Row label="Exchange rate">
                1 {userReceives?.currency ?? amount.tokenSymbol} ={" "}
                {formatNumber(quote.amounts.rate)}{" "}
                {quote.amounts.rate_currency ?? userPays?.currency ?? amount.receiveCurrency}
              </Row>
            ) : null}
            {userPays ? (
              <Row label="You will spend">
                {`${formatNumber(userPays.amount)} ${userPays.currency}`}
              </Row>
            ) : null}
            {userReceives ? (
              <Row label="Recipient gets">
                {`${formatNumber(userReceives.amount)} ${userReceives.currency}`}
              </Row>
            ) : null}
            {feeLines.map((f) => (
              <Row key={f.label} label={f.label}>
                <span className="capitalize">{f.value}</span>
              </Row>
            ))}
            {remainingMs !== null ? (
              <Row label="Quote expires in">
                <span className={remainingMs <= 30_000 ? "text-[#A1352F]" : undefined}>
                  {formatRemaining(remainingMs)}
                </span>
              </Row>
            ) : null}
          </>
        ) : null}
      </dl>

      {isExpired && !quoteLoading ? (
        <div className="rounded-lg border border-[#F5B5B3] bg-[#FFF4F3] p-3 text-xs text-[#A1352F]">
          This quote has expired. Refresh for an up-to-date rate before confirming.
        </div>
      ) : null}

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
        {isExpired ? (
          <button
            type="button"
            onClick={() => void requestQuote()}
            disabled={quoteLoading}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {quoteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Refresh quote
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setPinOpen(true)}
            disabled={!quote || quoteLoading}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Confirm payment
          </button>
        )}
      </div>

      {pinOpen && quote ? (
        <PinStep
          quoteId={quote.quote_id}
          onClose={() => setPinOpen(false)}
          onExpired={() => {
            setPinOpen(false);
            void requestQuote();
          }}
        />
      ) : null}
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
