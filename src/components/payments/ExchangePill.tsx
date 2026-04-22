"use client";

type ExchangePillProps = {
  fromFlag: string;
  toFlag: string;
  fromAmount: number;
  fromLabel: string;
  toAmount: number;
  toLabel: string;
};

export default function ExchangePill({
  fromFlag,
  toFlag,
  fromAmount,
  fromLabel,
  toAmount,
  toLabel,
}: ExchangePillProps) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-tertiary-200 bg-tertiary-50 px-4 py-1.5 text-xs font-medium text-tertiary-700">
        <span className="flex items-center -space-x-1.5 text-base leading-none">
          <span>{fromFlag}</span>
          <span>{toFlag}</span>
        </span>
        <span>
          {fromAmount} {fromLabel} = {toAmount.toLocaleString()} {toLabel}
        </span>
      </div>
    </div>
  );
}
