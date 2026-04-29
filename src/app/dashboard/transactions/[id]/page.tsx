"use client";

import { use, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag as FlagIcon,
  RotateCcw,
} from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import { StatusBadge, mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import { recentTransactions } from "@/components/dashboard/dashboardData";
import ShareReceiptDropdown from "@/components/transactions/ShareReceiptDropdown";

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
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7EAF3] bg-white text-[#6B7287] transition hover:border-[#CDD2E0] hover:text-[#2A3150] disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#5A6080] dark:hover:border-[#3A4060] dark:hover:text-[#C0C6DF]"
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
        "flex items-center justify-between gap-4 py-3.5",
        separatorAbove ? "mt-1 border-t border-[#F0F2F7] pt-5 dark:border-[#252840]" : "",
      )}
    >
      <span className="text-sm text-[#8D92A6] dark:text-[#5A6080]">{label}</span>
      <span className="text-right text-sm font-medium text-[#1F2640] dark:text-[#E0E5F5]">
        {children}
      </span>
    </div>
  );
}

function CurrencyPairIcon({ from, to }: { from: "US"; to: "KE" | "NG" | "GH" }) {
  return (
    <span className="relative inline-flex h-5 w-8 items-center">
      <span className="absolute left-0 z-10">
        <Flag code={from} size={18} />
      </span>
      <span className="absolute left-3">
        <Flag code={to} size={18} />
      </span>
    </span>
  );
}

export default function TransactionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const txn = recentTransactions.find((t) => t.id === id);
  const [idCopied, setIdCopied] = useState(false);

  if (!txn) return notFound();

  const isIn = txn.direction === "in";
  const unsignedAmount = txn.amount.replace(/^[-+]/, "");
  const category = isIn ? "Pay-in" : "Pay-out";

  async function copyId() {
    if (!txn) return;
    try {
      await navigator.clipboard.writeText(txn.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 1500);
    } catch {
      /* no-op */
    }
  }

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
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#171D32] sm:text-[24px] dark:text-[#E8ECF8]">
            Transaction Details
          </h1>
        </div>
        <ShareReceiptDropdown txn={txn} />
      </header>

      <div className="mx-auto w-full max-w-[760px]">
        <div className="rounded-2xl border border-[#ECEEF5] bg-white px-4 pb-6 pt-8 shadow-[0_4px_30px_rgba(16,24,40,0.04)] sm:px-10 sm:pb-8 sm:pt-10 dark:border-[#252840] dark:bg-[#13162A]">
          {/* Amount hero */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F8EF] text-[#1E9F72]"
                aria-hidden
              >
                {isIn ? (
                  <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={3} />
                )}
              </span>
              <span className="text-sm text-[#7E8498] dark:text-[#5A6080]">
                {isIn ? "You received" : "You sent"}
              </span>
            </div>

            <p className="mt-3 text-[32px] font-semibold tracking-[-0.02em] text-[#1A2138] sm:text-[36px] dark:text-[#E8ECF8]">
              {unsignedAmount}
            </p>

            <p className="mt-2 text-sm">
              <span className="text-[#8D92A6] dark:text-[#5A6080]">+Fees:</span>{" "}
              <span className="font-medium text-tertiary-600">{txn.fees}</span>
            </p>

            <p className="mt-1 text-sm text-[#9CA3B6] dark:text-[#4A5070]">~ {txn.usdEquivalent}</p>
          </div>

          {/* KV rows — first group */}
          <div className="mt-10 divide-y divide-[#F0F2F7] dark:divide-[#252840]">
            <KVRow label="Recipient's name">{txn.accountName}</KVRow>
            <KVRow label="Recipient's email address">
              <span className="break-all">{txn.recipientEmail}</span>
            </KVRow>
            <KVRow label="Payment method">{txn.paymentMethod}</KVRow>
            <KVRow label="Bank name">{txn.bankName}</KVRow>
            <KVRow label="Account number">{txn.accountNumber}</KVRow>
            <KVRow label="Date & Time">
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>{txn.date.split(" • ")[0] ?? txn.date}</span>
                <span className="text-[#CDD2E0] dark:text-[#2A3050]">|</span>
                <span>{txn.date.split(" • ")[1] ?? ""}</span>
              </span>
            </KVRow>
            <KVRow label="Exchange rate">
              <span className="inline-flex items-center gap-2">
                <CurrencyPairIcon from="US" to={txn.country} />
                <span>{txn.fxRate}</span>
              </span>
            </KVRow>
          </div>

          {/* KV rows — second group */}
          <div className="mt-6 divide-y divide-[#F0F2F7] border-t border-[#F0F2F7] pt-2 dark:divide-[#252840] dark:border-[#252840]">
            <KVRow label="Transaction type">{txn.type}</KVRow>
            <KVRow label="Transaction category">{category}</KVRow>
            <KVRow label="Transacting wallet">
              <button
                type="button"
                onClick={() => router.push("/dashboard/wallets")}
                className="font-medium text-primary-600 underline-offset-2 transition hover:text-primary-700 hover:underline dark:text-primary-400 dark:hover:text-primary-300"
              >
                {txn.reference || "Wallet name"}
              </button>
            </KVRow>
            <KVRow label="Transaction ID">
              <span className="inline-flex items-center gap-2">
                <span className="max-w-[120px] truncate sm:max-w-none">{txn.id}</span>
                <button
                  type="button"
                  onClick={copyId}
                  aria-label="Copy transaction ID"
                  className="text-[#9298AC] transition hover:text-primary-600 dark:text-[#5A6080] dark:hover:text-primary-400"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {idCopied && (
                  <span className="text-[11px] font-medium text-tertiary-600">Copied</span>
                )}
              </span>
            </KVRow>
            <KVRow label="Transaction status">
              <StatusBadge status={txn.status} />
            </KVRow>
            <KVRow label="Transaction processing time">{txn.processingTime}</KVRow>
            {txn.narration && <KVRow label="Narration">{txn.narration}</KVRow>}
          </div>

          {/* Footer actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[#F0F2F7] pt-6 text-sm font-semibold dark:border-[#252840]">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[#E25555] transition hover:text-[#B83F3F] dark:text-red-400 dark:hover:text-red-300"
            >
              <FlagIcon className="h-4 w-4" />
              Report transaction
            </button>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <CalendarClock className="h-4 w-4" />
                Schedule transaction
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/send-payment")}
                className="inline-flex items-center gap-2 text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <RotateCcw className="h-4 w-4" />
                Repeat transaction
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
