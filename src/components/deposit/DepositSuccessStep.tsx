"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Wallet2 } from "lucide-react";
import CopyToast from "@/components/wallets/CopyToast";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import { useDepositStore } from "@/stores/depositStore";

function formatProcessingTime(ms: number | null): string {
  if (!ms || ms < 0) return "—";
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export default function DepositSuccessStep() {
  const router = useRouter();
  const { copy, toast } = useCopyToClipboard();
  const {
    selectedCurrency,
    selectedWalletLabel,
    amountFiat,
    orderResult,
  } = useDepositStore();

  const txId = orderResult?.orderId ?? "—";
  const amountDisplay = `${selectedCurrency ?? ""} ${amountFiat.toLocaleString("en-US", {
    maximumFractionDigits: 2,
  })}`.trim();

  function viewDetails() {
    if (orderResult?.orderId) {
      router.push(`/dashboard/transactions/${orderResult.orderId}`);
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
        <p className="text-2xl font-bold text-[#1A2138]">Deposit Confirmed!</p>
        <p className="mt-2 text-sm text-[#7E8498]">
          Congratulations. You successfully deposited
        </p>
        <p className="mt-1 text-2xl font-bold text-[#1A2138]">{amountDisplay}</p>
        <p className="mt-1 text-sm text-[#7E8498]">
          into <span className="font-semibold text-[#1A2138]">{selectedWalletLabel ?? "Wallet"}</span>
        </p>

        <hr className="my-6 border-t border-[#ECEEF5]" />

        <dl className="space-y-3 text-left">
          <Row label="Transaction ID">
            <span className="flex items-center gap-2">
              <span className="font-mono text-sm text-[#1A2138]">
                {txId.length > 20 ? `${txId.slice(0, 10)}…${txId.slice(-6)}` : txId}
              </span>
              {orderResult?.orderId ? (
                <button
                  type="button"
                  onClick={() => copy(orderResult.orderId!, "Transaction ID copied")}
                  aria-label="Copy transaction ID"
                  className="text-[#7E8498] transition hover:text-primary-500"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </span>
          </Row>
          <Row label="Transaction status">
            <span className="inline-flex items-center gap-1 rounded-md border border-[#BFE9D2] bg-[#E8F8EF] px-2 py-1 text-[11px] font-medium text-[#1E9F72]">
              <CheckCircle2 className="h-3 w-3" />
              Successful
            </span>
          </Row>
          <Row label="Transaction processing time">
            <span className="text-sm text-[#1A2138]">
              {formatProcessingTime(orderResult?.processingTimeMs ?? null)}
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
            View deposit details
          </button>
        </div>
      </div>

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-sm text-[#7E8498]">{label}</dt>
      <dd className="text-sm text-[#1A2138]">{children}</dd>
    </div>
  );
}
