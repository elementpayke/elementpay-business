"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowDown, ExternalLink, Loader2, X } from "lucide-react";
import { erc20Abi, isAddress, parseUnits } from "viem";
import { base } from "wagmi/chains";
import { useSwitchChain, useWriteContract } from "wagmi";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { SUPPORTED_TOKENS } from "@/lib/wallets/supportedTokens";
import { shortAddress } from "@/lib/wallets/wallet-selection";
import type { LiveWallet } from "@/lib/wallets/types";

const USDC_BASE = SUPPORTED_TOKENS.find((t) => t.symbol === "USDC" && t.chain === "Base")!;

type WalletTransferModalProps = {
  open: boolean;
  onClose: () => void;
  source: LiveWallet | null;
  /** Other live wallets the user owns - surfaced as quick "Send to my wallet" picks. */
  ownedWallets: LiveWallet[];
};

type TxState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; hash: `0x${string}` }
  | { kind: "error"; message: string };

export default function WalletTransferModal(props: WalletTransferModalProps) {
  if (!props.open || !props.source) return null;
  return <WalletTransferModalBody {...props} source={props.source} />;
}

function WalletTransferModalBody({
  onClose,
  source,
  ownedWallets,
}: WalletTransferModalProps & { source: LiveWallet }) {
  const { formatMoneyFromUsd } = useCurrency();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const otherOwned = useMemo(
    () => ownedWallets.filter((w) => w.address !== source.address),
    [ownedWallets, source],
  );

  const recipientValid = recipient !== "" && isAddress(recipient);
  const amountNumber = Number(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const overBalance = amountNumber > source.balance.amount;
  const sendingToSelf = recipient.toLowerCase() === source.address.toLowerCase();
  const submitDisabled =
    !recipientValid || !amountValid || overBalance || sendingToSelf || tx.kind === "submitting";

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (submitDisabled) return;

    setTx({ kind: "submitting" });
    try {
      if (source.chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }
      const value = parseUnits(amount, USDC_BASE.decimals);
      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: USDC_BASE.tokenAddress,
        functionName: "transfer",
        args: [recipient as `0x${string}`, value],
        chainId: base.id,
        account: source.address,
      });
      setTx({ kind: "success", hash });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transfer failed";
      setTx({ kind: "error", message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1129]/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#ECEEF5] bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.18)]">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#1A2138]">Send USDC</h3>
            <p className="mt-1 text-sm text-[#7E8498]">
              Transfer USDC on Base from one of your wallets.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close transfer modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ECEEF5] text-[#7E8498] transition hover:border-[#CDD2E0] hover:text-[#1A2138]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] p-3">
          <p className="text-xs font-medium text-[#7E8498]">From</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#1A2138]">{source.label}</p>
              <p className="text-xs text-[#8E93A7]">{shortAddress(source.address)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#1A2138]">
                {source.balance.formatted} <span className="text-[#5F667D]">USDC</span>
              </p>
              <p className="text-[11px] text-[#8E93A7]">on Base</p>
            </div>
          </div>
        </div>

        <div className="my-2 flex justify-center">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ECEEF5] bg-white text-[#5F667D]">
            <ArrowDown className="h-3.5 w-3.5" />
          </span>
        </div>

        <form className="space-y-4" onSubmit={handleSend}>
          <label className="block text-sm">
            <span className="text-xs font-medium text-[#4D556D]">Recipient address</span>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              placeholder="0x..."
              spellCheck={false}
              autoComplete="off"
              className="mt-1 h-11 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 font-mono text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
            />
            {recipient && !recipientValid ? (
              <p className="mt-1 text-xs text-[#E35D5B]">Not a valid EVM address.</p>
            ) : null}
            {sendingToSelf ? (
              <p className="mt-1 text-xs text-[#E35D5B]">Sending to the source wallet itself.</p>
            ) : null}
          </label>

          {otherOwned.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#8E93A7]">
                Send to one of your wallets
              </p>
              <div className="flex flex-wrap gap-2">
                {otherOwned.map((w) => (
                  <button
                    key={w.address}
                    type="button"
                    onClick={() => setRecipient(w.address)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E1E4EE] bg-white px-3 py-1.5 text-xs font-medium text-[#3F465E] transition hover:border-primary-300 hover:text-primary-700"
                  >
                    {w.label} · {shortAddress(w.address)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <label className="block text-sm">
            <span className="text-xs font-medium text-[#4D556D]">Amount (USDC)</span>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-11 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 pr-24 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setAmount(source.balance.formatted)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-primary-100/60 px-2.5 py-1 text-[11px] font-semibold text-primary-700 transition hover:bg-primary-100"
              >
                Max
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-[#8E93A7]">
              <span>{formatMoneyFromUsd(amountValid ? amountNumber : 0)}</span>
              <span>Available: {source.balance.formatted} USDC</span>
            </div>
            {overBalance ? (
              <p className="mt-1 text-xs text-[#E35D5B]">Amount exceeds wallet balance.</p>
            ) : null}
          </label>

          {tx.kind === "error" ? (
            <p className="rounded-lg border border-[#F5C2C0] bg-[#FFF5F4] px-3 py-2 text-xs text-[#B23B38]">
              {tx.message}
            </p>
          ) : null}

          {tx.kind === "success" ? (
            <a
              href={`${USDC_BASE.explorerUrl}/tx/${tx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-tertiary-200 bg-tertiary-50 px-3 py-2 text-xs font-medium text-tertiary-700 transition hover:border-tertiary-300"
            >
              <Image src="/Base_Symbol_Blue.svg" alt="Base" width={12} height={12} />
              Sent · view on BaseScan
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}

          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-lg border border-[#E1E4EE] text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
            >
              {tx.kind === "success" ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={submitDisabled}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {tx.kind === "submitting" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Send USDC"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
