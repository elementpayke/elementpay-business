"use client";

type FeeSummaryProps = {
  sendAmount: number;
  fee: number;
  totalDebit: number;
  currency: string;
};

function formatAmount(amount: number) {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function FeeSummary({ sendAmount, fee, totalDebit, currency }: FeeSummaryProps) {
  return (
    <div className="rounded-2xl border border-[#EEF0F6] bg-[#FAFBFE] p-4 text-sm">
      <div className="flex items-center justify-between py-2 text-[#4F576E]">
        <span>Amount you are to send</span>
        <span>
          {currency} {formatAmount(sendAmount)}
        </span>
      </div>
      <div className="flex items-center justify-between py-2 text-[#4F576E]">
        <span>Our transaction fee</span>
        <span>
          {currency} {formatAmount(fee)}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-[#EEF0F6] pt-3 text-[#1D243C]">
        <span className="font-semibold">Total amount</span>
        <span className="font-semibold">
          {currency} {formatAmount(totalDebit)}
        </span>
      </div>
    </div>
  );
}
