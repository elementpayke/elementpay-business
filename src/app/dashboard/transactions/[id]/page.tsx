"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
} from "lucide-react";
import {
  StatusBadge,
  mergeClasses,
} from "@/components/dashboard/DashboardPrimitives";
import EmptyState from "@/components/dashboard/EmptyState";
import ShareReceiptDropdown from "@/components/transactions/ShareReceiptDropdown";
import { useTransaction } from "@/lib/dashboard/hooks";
import { TransactionNotFoundError } from "@/lib/dashboard/api";
import { toTransactionRow } from "@/lib/dashboard/transactionView";
import { isTerminalOrderStatus } from "@/lib/orders";
import { useOrderStatusStream } from "@/lib/orders/useOrderStatusStream";
import type { SocketStatus } from "@/lib/orders/orderStatusSocket";

function HistoryButton({
  disabled = false,
  onClick,
  children,
  ariaLabel,
}: {
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7EAF3] bg-white text-[#6B7287] transition hover:border-[#CDD2E0] hover:text-[#2A3150] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

function KVRow({
  label,
  children,
  separatorAbove = false,
}: {
  label: string;
  children: React.ReactNode;
  separatorAbove?: boolean;
}) {
  return (
    <div
      className={mergeClasses(
        "flex items-center justify-between gap-6 py-3.5",
        separatorAbove ? "border-t border-[#F0F2F7] mt-1 pt-5" : "",
      )}
    >
      <span className="text-sm text-[#8D92A6]">{label}</span>
      <span className="text-right text-sm font-medium text-[#1F2640]">
        {children}
      </span>
    </div>
  );
}

function formatTimestamp(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
}

/** Small pill showing the live websocket connection state next to the status. */
function LiveStatusIndicator({
  socketStatus,
  isTerminal,
}: {
  socketStatus: SocketStatus;
  isTerminal: boolean;
}) {
  // Once settled there are no more updates — don't imply a live connection.
  if (isTerminal) return null;

  if (socketStatus === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EF] px-2 py-0.5 text-[11px] font-medium text-[#1E9F72]">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E9F72] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1E9F72]" />
        </span>
        Live
      </span>
    );
  }
  if (socketStatus === "connecting" || socketStatus === "reconnecting") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7E8] px-2 py-0.5 text-[11px] font-medium text-[#B7791F]">
        <Loader2 className="h-3 w-3 animate-spin" />
        Connecting…
      </span>
    );
  }
  return null;
}

export default function TransactionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const { data: txn, isLoading, isError, error } = useTransaction(id);
  const [idCopied, setIdCopied] = useState(false);

  // Stream live status updates while the order isn't already terminal. The hook
  // patches the ["transaction", id] cache, so `txn.status` / StatusBadge below
  // update automatically; we only read socketStatus/isTerminal for the badge.
  const alreadyTerminal = isTerminalOrderStatus(txn?.status);
  const { socketStatus, isTerminal } = useOrderStatusStream(id, {
    enabled: Boolean(txn) && !alreadyTerminal,
  });

  async function copyId() {
    if (!txn) return;
    try {
      await navigator.clipboard.writeText(String(txn.id));
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 1500);
    } catch {
      /* no-op */
    }
  }

  if (isLoading) {
    return (
      <section className="flex items-center justify-center py-20 text-sm text-[#8D92A6]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading transaction…
      </section>
    );
  }

  if (error instanceof TransactionNotFoundError) {
    return notFound();
  }

  if (isError || !txn) {
    return (
      <section className="space-y-6">
        <EmptyState
          title="Transaction unavailable"
          description="We couldn't load this transaction. Please try again."
        />
      </section>
    );
  }

  const row = toTransactionRow(txn);
  const isIn = row.direction === "in";
  const { date, time } = formatTimestamp(txn.created_at);
  const category = isIn ? "Pay-in" : row.direction === "out" ? "Pay-out" : "Order";
  const unsignedAmount = row.amount.replace(/^[-+]/, "");

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <HistoryButton onClick={() => router.back()} ariaLabel="Back">
              <ChevronLeft className="h-4 w-4" />
            </HistoryButton>
            <HistoryButton disabled ariaLabel="Forward">
              <ChevronRight className="h-4 w-4" />
            </HistoryButton>
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#171D32]">
            Transaction Details
          </h1>
        </div>
        <ShareReceiptDropdown txn={row} />
      </header>

      <div className="mx-auto w-full max-w-[760px]">
        <div className="rounded-2xl border border-[#ECEEF5] bg-white px-10 pb-8 pt-10 shadow-[0_4px_30px_rgba(16,24,40,0.04)]">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <span
                className={mergeClasses(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  isIn
                    ? "bg-[#E8F8EF] text-[#1E9F72]"
                    : "bg-[#FFEFEF] text-[#D95252]",
                )}
                aria-hidden
              >
                {isIn ? (
                  <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={3} />
                )}
              </span>
              <span className="text-sm text-[#7E8498]">
                {isIn
                  ? "You received"
                  : row.direction === "out"
                    ? "You sent"
                    : "Order"}
              </span>
            </div>

            <p className="mt-3 text-[36px] font-semibold tracking-[-0.02em] text-[#1A2138]">
              {unsignedAmount}
            </p>
          </div>

          <div className="mt-10 divide-y divide-[#F0F2F7]">
            <KVRow label="Payment method">{row.paymentMethod}</KVRow>
            {txn.wallet_address ? (
              <KVRow label="Wallet address">
                <span className="break-all font-mono text-xs">
                  {txn.wallet_address}
                </span>
              </KVRow>
            ) : null}
            <KVRow label="Date & Time">
              <span className="inline-flex items-center gap-2">
                <span>{date}</span>
                {time ? (
                  <>
                    <span className="text-[#CDD2E0]">|</span>
                    <span>{time}</span>
                  </>
                ) : null}
              </span>
            </KVRow>
          </div>

          <div className="mt-6 divide-y divide-[#F0F2F7] border-t border-[#F0F2F7] pt-2">
            <KVRow label="Transaction type">{row.type}</KVRow>
            <KVRow label="Transaction category">{category}</KVRow>
            <KVRow label="Currency">{row.currency || "—"}</KVRow>
            <KVRow label="Transaction ID">
              <span className="inline-flex items-center gap-2">
                {row.id}
                <button
                  type="button"
                  onClick={copyId}
                  aria-label="Copy transaction ID"
                  className="text-[#9298AC] transition hover:text-primary-600"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {idCopied ? (
                  <span className="text-[11px] font-medium text-tertiary-600">
                    Copied
                  </span>
                ) : null}
              </span>
            </KVRow>
            {txn.aggregator_order_id ? (
              <KVRow label="Aggregator order ID">
                <span className="font-mono text-xs">
                  {txn.aggregator_order_id}
                </span>
              </KVRow>
            ) : null}
            {txn.external_order_id ? (
              <KVRow label="External reference">
                <span className="font-mono text-xs">
                  {txn.external_order_id}
                </span>
              </KVRow>
            ) : null}
            <KVRow label="Transaction status">
              <span className="inline-flex items-center gap-2">
                <LiveStatusIndicator
                  socketStatus={socketStatus}
                  isTerminal={isTerminal || alreadyTerminal}
                />
                <StatusBadge status={row.status} />
              </span>
            </KVRow>
          </div>
        </div>
      </div>
    </section>
  );
}
