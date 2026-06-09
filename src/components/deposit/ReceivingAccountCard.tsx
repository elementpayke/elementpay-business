"use client";

import { Copy } from "lucide-react";
import CopyToast from "@/components/wallets/CopyToast";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import type { ProviderAccountDetails } from "@/lib/catalog/api";

type ReceivingAccountCardProps = {
  details: ProviderAccountDetails;
  /** When true, render the subtle "pending backend" footnote. */
  isFallback?: boolean;
};

type Field = { label: string; value: string; copyable?: boolean };

/**
 * Read-only card showing OUR receiving account for a bank pay-in — i.e. where
 * the user pushes money to fund their wallet. Used on the deposit selection
 * step and on the success step.
 */
export default function ReceivingAccountCard({
  details,
  isFallback = false,
}: ReceivingAccountCardProps) {
  const { copy, toast } = useCopyToClipboard();

  const fields: Field[] = [
    { label: "Bank", value: details.bank_name ?? "" },
    { label: "Account name", value: details.account_name ?? "" },
    { label: "Account number", value: details.account_number ?? "", copyable: true },
    ...(details.branch ? [{ label: "Branch", value: details.branch }] : []),
    ...(details.swift ? [{ label: "SWIFT/BIC", value: details.swift, copyable: true }] : []),
    ...(details.reference
      ? [{ label: "Reference", value: details.reference, copyable: true }]
      : []),
  ].filter((f) => f.value.length > 0);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#ECEEF5] bg-[#FAFBFE] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#8D92A6]">
          Send your deposit to
        </p>
        <dl className="space-y-2.5">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-4">
              <dt className="text-xs text-[#7E8498]">{f.label}</dt>
              <dd className="flex items-center gap-2 text-right text-sm font-medium text-[#1A2138]">
                <span className="break-all">{f.value}</span>
                {f.copyable ? (
                  <button
                    type="button"
                    onClick={() => copy(f.value, `${f.label} copied`)}
                    aria-label={`Copy ${f.label.toLowerCase()}`}
                    className="shrink-0 text-[#9CA3B6] transition hover:text-primary-500"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
        {details.instructions ? (
          <p className="mt-3 border-t border-[#EFF2F7] pt-3 text-xs text-[#7E8498]">
            {details.instructions}
          </p>
        ) : null}
      </div>

      {details.reference ? (
        <p className="text-[11px] text-[#8E93A7]">
          Include the reference so we can match your transfer to this deposit.
        </p>
      ) : null}

      {isFallback ? (
        <p className="text-[11px] italic text-[#A9AEC0]">
          Placeholder details — pending backend.
        </p>
      ) : null}

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}
