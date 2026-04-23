"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowDownToLine,
  Check,
  ChevronDown,
  Copy,
  Loader2,
  Phone,
  QrCode,
  ShieldAlert,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { SUPPORTED_TOKENS, type SupportedToken } from "@/lib/wallets/supportedTokens";
import { validateKenyanPhoneNumber } from "@/lib/phoneValidation";
import {
  AggregatorError,
  createOnRampOrder,
  fetchOrderQuote,
} from "@/lib/aggregator";
import type { LiveWallet } from "@/lib/wallets/types";

type TabKey = "onramp" | "wallet";

type OrderState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; message: string; txHash?: string }
  | { kind: "error"; message: string };

type ReceiveModalProps = {
  open: boolean;
  onClose: () => void;
  wallet: LiveWallet | null;
};

export default function ReceiveModal({ open, onClose, wallet }: ReceiveModalProps) {
  const [tab, setTab] = useState<TabKey>("onramp");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1129]/40 px-4">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-[#ECEEF5] bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.18)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100/60 text-primary-600">
              <ArrowDownToLine className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#1A2138]">Receive funds</h3>
              <p className="text-xs text-[#7E8498]">Top up from M-Pesa or share your wallet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ECEEF5] text-[#7E8498] transition hover:border-[#CDD2E0] hover:text-[#1A2138]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-xl bg-[#F4F6FC] p-1">
          <TabButton active={tab === "onramp"} onClick={() => setTab("onramp")} icon={Phone}>
            M-Pesa
          </TabButton>
          <TabButton active={tab === "wallet"} onClick={() => setTab("wallet")} icon={QrCode}>
            Wallet address
          </TabButton>
        </div>

        <div className="mt-5">
          {tab === "onramp" ? <OnRampTab wallet={wallet} /> : <WalletTab wallet={wallet} />}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-white text-[#1A2138] shadow-sm" : "text-[#6B7287] hover:text-[#1A2138]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function OnRampTab({ wallet }: { wallet: LiveWallet | null }) {
  const availableTokens = useMemo<SupportedToken[]>(() => {
    if (!wallet) return SUPPORTED_TOKENS;
    if (wallet.kind === "embedded") {
      // Embedded wallets don't support Scroll/Lisk — keep the crypto side in sync.
      return SUPPORTED_TOKENS.filter((t) => t.chain !== "Scroll" && t.chain !== "Lisk");
    }
    return SUPPORTED_TOKENS;
  }, [wallet]);

  // SUPPORTED_TOKENS is non-empty, so availableTokens[0] is always defined.
  const [token, setToken] = useState<SupportedToken>(() => availableTokens[0] ?? SUPPORTED_TOKENS[0]);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [phone, setPhone] = useState(""); // local 9-digit portion (7XX XXX XXX)
  const [amountKes, setAmountKes] = useState("");
  const [reason, setReason] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteTokenAmount, setQuoteTokenAmount] = useState<number | null>(null);
  const [quoteRate, setQuoteRate] = useState<number | null>(null);
  const [quoteFee, setQuoteFee] = useState<number | null>(null);
  const [state, setState] = useState<OrderState>({ kind: "idle" });

  const fullPhone = phone ? `254${phone}` : "";
  const phoneValidation = fullPhone
    ? validateKenyanPhoneNumber(fullPhone)
    : ({ isValid: false } as ReturnType<typeof validateKenyanPhoneNumber>);

  const amountNumber = Number(amountKes);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const canFetchQuote = Boolean(wallet && amountValid);
  const visibleQuoteTokenAmount = canFetchQuote ? quoteTokenAmount : null;
  const visibleQuoteRate = canFetchQuote ? quoteRate : null;
  const visibleQuoteFee = canFetchQuote ? quoteFee : null;

  // Debounced quote fetch whenever the KES amount or selected token changes.
  useEffect(() => {
    if (!wallet || !amountValid) {
      return;
    }
    let cancelled = false;
    const handle = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const quote = await fetchOrderQuote({
          amountFiat: amountNumber,
          tokenAddress: token.tokenAddress,
          walletAddress: wallet.address,
          orderType: 0,
          currency: "KES",
        });
        if (cancelled) return;
        setQuoteTokenAmount(quote.data.required_token_amount);
        setQuoteRate(quote.data.effective_rate);
        setQuoteFee(quote.data.fee_amount);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Could not fetch live rate";
        console.warn("[ReceiveModal] quote failed:", message);
        setQuoteTokenAmount(null);
        setQuoteRate(null);
        setQuoteFee(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [amountNumber, amountValid, token.tokenAddress, wallet]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!wallet) {
      setState({ kind: "error", message: "Select a wallet first." });
      return;
    }
    if (!phoneValidation.isValid) {
      setState({ kind: "error", message: "Enter a valid M-Pesa number." });
      return;
    }
    if (!amountValid) {
      setState({ kind: "error", message: "Enter an amount greater than zero." });
      return;
    }

    setState({ kind: "submitting" });
    try {
      const res = await createOnRampOrder({
        userAddress: wallet.address,
        tokenAddress: token.tokenAddress,
        amountFiat: amountNumber,
        phoneNumber: fullPhone,
        reason: reason || undefined,
        currency: "KES",
      });
      setState({
        kind: "success",
        message:
          res.message ||
          `STK push sent to ${fullPhone}. Approve on your phone to complete the deposit.`,
        txHash: res.data?.tx_hash,
      });
    } catch (err) {
      const message =
        err instanceof AggregatorError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to create order.";
      setState({ kind: "error", message });
    }
  }

  if (!wallet) {
    return (
      <p className="rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] p-4 text-center text-sm text-[#7E8498]">
        Connect or select a wallet to receive deposits.
      </p>
    );
  }

  if (state.kind === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-600">
          <Check className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A2138]">STK push sent</p>
          <p className="mt-1 text-xs text-[#7E8498]">{state.message}</p>
        </div>
        {state.txHash ? (
          <p className="break-all rounded-lg border border-[#ECEEF5] bg-[#FAFBFE] px-3 py-2 font-mono text-[11px] text-[#5F667D]">
            tx: {state.txHash}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setState({ kind: "idle" });
            setAmountKes("");
            setReason("");
          }}
          className="w-full rounded-lg border border-[#E1E4EE] py-2.5 text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
        >
          New deposit
        </button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">
          M-Pesa phone number
        </label>
        <div
          className={`flex overflow-hidden rounded-lg border bg-[#FAFBFE] transition focus-within:bg-white ${
            phone && !phoneValidation.isValid
              ? "border-[#F5B5B3]"
              : phoneValidation.isValid
                ? "border-tertiary-300"
                : "border-[#ECEEF4]"
          }`}
        >
          <div className="flex items-center gap-1.5 border-r border-[#ECEEF4] px-3 py-2.5 text-xs font-medium text-[#4D556D]">
            <span>🇰🇪</span>
            <span>+254</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="7XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[#1F2640] outline-none placeholder:text-[#8E93A7]"
          />
          {phoneValidation.isValid ? (
            <div className="flex items-center pr-3">
              <Check className="h-4 w-4 text-tertiary-500" />
            </div>
          ) : null}
        </div>
        {phone && !phoneValidation.isValid && phoneValidation.error ? (
          <p className="mt-1 text-xs text-[#E35D5B]">{phoneValidation.error}</p>
        ) : (
          <p className="mt-1 text-[11px] text-[#8E93A7]">
            You&apos;ll receive an M-Pesa STK push on this number.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">
          Amount to deposit (KES)
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={amountKes}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^0-9.]/g, "");
              const parts = sanitized.split(".");
              const trimmed = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : sanitized;
              setAmountKes(trimmed);
            }}
            className="h-11 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 pr-28 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
          />
          <TokenSelector
            token={token}
            onChange={setToken}
            options={availableTokens}
            open={tokenDropdownOpen}
            setOpen={setTokenDropdownOpen}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#7E8498]">
          <span>
            {quoteLoading ? (
              <span className="inline-flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Fetching live rate…
              </span>
            ) : visibleQuoteTokenAmount !== null ? (
              <>
                You receive ≈{" "}
                <span className="font-semibold text-[#1F2640]">
                  {visibleQuoteTokenAmount.toFixed(token.decimals === 18 ? 6 : 4)} {token.symbol}
                </span>
              </>
            ) : amountValid ? (
              "Rate unavailable"
            ) : (
              "Enter an amount to see the live rate"
            )}
          </span>
          {visibleQuoteRate ? <span>1 {token.symbol} ≈ KES {visibleQuoteRate.toFixed(2)}</span> : null}
        </div>
        {visibleQuoteFee ? (
          <p className="mt-1 text-[11px] text-[#7E8498]">Fee ≈ KES {visibleQuoteFee.toFixed(2)}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">
          Reason <span className="text-[#8E93A7]">(optional)</span>
        </label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Top-up, Savings"
          className="h-11 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
        />
      </div>

      {state.kind === "error" ? (
        <p className="rounded-lg border border-[#F5C2C0] bg-[#FFF5F4] px-3 py-2 text-xs text-[#B23B38]">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!phoneValidation.isValid || !amountValid || state.kind === "submitting"}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {state.kind === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending STK push…
          </>
        ) : (
          "Request deposit"
        )}
      </button>
    </form>
  );
}

function TokenSelector({
  token,
  onChange,
  options,
  open,
  setOpen,
}: {
  token: SupportedToken;
  onChange: (t: SupportedToken) => void;
  options: SupportedToken[];
  open: boolean;
  setOpen: (next: boolean) => void;
}) {
  return (
    <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#1A2138] shadow-sm ring-1 ring-[#ECEEF4] hover:ring-primary-200"
      >
        <Image
          src={token.tokenLogo}
          alt=""
          width={14}
          height={14}
          className="rounded-full"
        />
        <span>{token.symbol}</span>
        <span className="text-[#8E93A7]">·</span>
        <span className="text-[#5F667D]">{token.chain}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-60 rounded-xl border border-[#ECEEF4] bg-white p-1.5 shadow-lg">
          {options.map((t) => {
            const active = t.symbol === token.symbol && t.chain === token.chain;
            return (
              <button
                key={`${t.symbol}-${t.chain}`}
                type="button"
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                  active ? "bg-primary-100/60 text-[#1A2138]" : "text-[#3F465E] hover:bg-[#F6F7FB]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Image src={t.tokenLogo} alt="" width={18} height={18} className="rounded-full" />
                  <span className="text-sm font-medium">{t.symbol}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#ECEEF4] px-1.5 py-0.5 text-[10px] text-[#5F667D]">
                    <Image src={t.chainLogo} alt="" width={10} height={10} className="rounded-full" />
                    {t.chain}
                  </span>
                </span>
                {active ? <Check className="h-3.5 w-3.5 text-primary-500" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function WalletTab({ wallet }: { wallet: LiveWallet | null }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const visibleQrDataUrl = wallet?.address ? qrDataUrl : null;

  useEffect(() => {
    if (!wallet?.address) {
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(wallet.address, { width: 220, margin: 1 })
      .then((url: string) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err: unknown) => {
        console.warn("[ReceiveModal] QR render failed:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [wallet?.address]);

  async function handleCopy() {
    if (!wallet?.address) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!wallet) {
    return (
      <p className="rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] p-4 text-center text-sm text-[#7E8498]">
        Connect or select a wallet to get a receive address.
      </p>
    );
  }

  const supportedForThisWallet =
    wallet.kind === "embedded"
      ? SUPPORTED_TOKENS.filter((t) => t.chain !== "Scroll" && t.chain !== "Lisk")
      : SUPPORTED_TOKENS;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8E93A7]">
          Active wallet
        </p>
        <p className="mt-1 text-sm font-semibold text-[#1A2138]">{wallet.label}</p>
        <p className="mt-0.5 text-xs text-[#7E8498]">
          {wallet.kind === "embedded" ? "Element Pay embedded wallet" : "External wallet"}
        </p>
      </div>

      <div className="flex justify-center rounded-xl border border-[#ECEEF5] bg-white p-4">
        {visibleQrDataUrl ? (
          <Image src={visibleQrDataUrl} alt="Wallet QR" width={220} height={220} unoptimized />
        ) : (
          <div className="flex h-[220px] w-[220px] items-center justify-center text-xs text-[#8E93A7]">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8E93A7]">
          Receive address
        </p>
        <p className="mt-1.5 break-all font-mono text-xs text-[#1A2138]">{wallet.address}</p>
        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 text-xs font-semibold text-white transition hover:brightness-105"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Address copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy address
            </>
          )}
        </button>
      </div>

      <div className="rounded-xl border border-[#F5B5B3] bg-[#FFF5F4] px-3 py-3 text-sm text-[#B23B38]">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-xs font-semibold">
              Only send supported tokens on supported networks
            </p>
            <p className="mt-1 text-[11px] leading-snug">
              Sending unsupported tokens — or tokens on networks we don&apos;t support here — to
              this address <strong>cannot be recovered</strong> and the funds will be lost. This
              is especially risky for embedded wallets.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8E93A7]">
          Supported assets
        </p>
        <ul className="mt-2 grid grid-cols-1 gap-1.5">
          {supportedForThisWallet.map((t) => (
            <li
              key={`${t.symbol}-${t.chain}`}
              className="flex items-center justify-between rounded-lg border border-[#ECEEF4] bg-white px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-[#1F2640]">
                <Image src={t.tokenLogo} alt="" width={18} height={18} className="rounded-full" />
                <span className="font-medium">{t.symbol}</span>
                <span className="text-[11px] text-[#8E93A7]">{t.name}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ECEEF4] px-2 py-0.5 text-[11px] text-[#5F667D]">
                <Image src={t.chainLogo} alt="" width={11} height={11} className="rounded-full" />
                {t.chain}
              </span>
            </li>
          ))}
        </ul>
        {wallet.kind === "embedded" ? (
          <p className="mt-2 text-[11px] text-[#8E93A7]">
            Your embedded wallet does <strong>not</strong> support Scroll or Lisk networks. Do not
            send tokens from those networks — they will be lost.
          </p>
        ) : null}
      </div>
    </div>
  );
}
