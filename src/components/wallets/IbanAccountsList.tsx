"use client";

import { useState } from "react";
import { Landmark, RefreshCw } from "lucide-react";
import CopyToast from "@/components/wallets/CopyToast";
import IbanAccountCard from "@/components/wallets/IbanAccountCard";
import Skeleton from "@/components/dashboard/Skeleton";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import { useIbanAccounts } from "@/lib/iban/useIbanAccounts";
import type { IbanAccount } from "@/lib/iban/api";

/** Stable key for an account row (IBAN is unique per account). */
function keyFor(account: IbanAccount, index: number): string {
  return account.iban || `${account.currency}-${index}`;
}

function SectionHeader({ count }: { count?: number }) {
  return (
    <div className="flex items-center justify-between">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-[#1C2238]">
        <Landmark className="h-4 w-4 text-[#7E8498]" />
        IBAN accounts
      </p>
      {typeof count === "number" && count > 0 ? (
        <span className="rounded-full bg-[#F4F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#5F667D]">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function IbanRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#ECEEF5] bg-white px-3.5 py-3">
      <Skeleton className="h-9 w-12" rounded="md" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-4 w-14" rounded="full" />
    </div>
  );
}

export default function IbanAccountsList() {
  const { data, isLoading, error, refetch, isRefetching } = useIbanAccounts();
  const { copy, toast } = useCopyToClipboard();
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SectionHeader />
        <IbanRowSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <SectionHeader />
        <div className="rounded-xl border border-dashed border-[#E1E4EE] bg-white px-4 py-5 text-center">
          <p className="text-sm font-medium text-[#1A2138]">Couldn&apos;t load IBAN accounts</p>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#E7EAF3] bg-white px-3 py-1.5 text-xs font-semibold text-[#5F667D] transition hover:border-[#D9DEEC] disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Retrying" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  const accounts = data ?? [];
  // No IBANs for this user — keep the column clean and render nothing.
  if (accounts.length === 0) return null;

  return (
    <div className="space-y-3">
      <SectionHeader count={accounts.length} />
      <p className="text-xs text-[#8E93A7]">
        Receive bank transfers to these virtual accounts. Tap a card to view full details.
      </p>

      <div className="space-y-3">
        {accounts.map((account, index) => {
          const key = keyFor(account, index);
          return (
            <IbanAccountCard
              key={key}
              account={account}
              expanded={openKey === key}
              onToggle={() => setOpenKey((current) => (current === key ? null : key))}
              copy={copy}
            />
          );
        })}
      </div>

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}
