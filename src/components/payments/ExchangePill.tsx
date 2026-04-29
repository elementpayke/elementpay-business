"use client";

import Flag from "@/components/dashboard/Flag";
import type { FlagCode } from "@/components/dashboard/Flag";

type ExchangePillProps = {
  /** FlagCode for the send currency (e.g. "US") */
  fromCode: FlagCode;
  /** FlagCode for the receive currency (e.g. "KE") */
  toCode: FlagCode;
  fromAmount: number;
  fromLabel: string;
  toAmount: number;
  toLabel: string;
};

export default function ExchangePill({
  fromCode,
  toCode,
  fromAmount,
  fromLabel,
  toAmount,
  toLabel,
}: ExchangePillProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-tertiary-200 bg-tertiary-50 px-3 py-1.5 text-xs font-medium text-tertiary-700">
        {/* Flags — side by side with a small gap, no negative overlap */}
        <span className="flex items-center gap-0.5">
          <Flag code={fromCode} size={14} />
          <Flag code={toCode} size={14} />
        </span>

        {/* Rate text */}
        <span className="whitespace-nowrap">
          {fromAmount} {fromLabel} = {toAmount.toLocaleString()} {toLabel}
        </span>
      </div>
    </div>
  );
}
