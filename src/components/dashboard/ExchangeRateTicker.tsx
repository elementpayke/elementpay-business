"use client";

import Flag from "@/components/dashboard/Flag";

type Rate = {
  code: "KE" | "NG" | "GH";
  text: string;
};

const rates: Rate[] = [
  { code: "KE", text: "1 US Dollar = 129.00 Kenyan Shillings" },
  { code: "NG", text: "1 US Dollar = 1,422.73 Nigerian Naira" },
  { code: "GH", text: "1 US Dollar = 10.775086 Ghanaian Cedis" },
];

export default function ExchangeRateTicker() {
  return (
    <section className="space-y-3">
      <div className="text-xs">
        <p className="font-medium text-foreground">Jan 14, 2026 Exchange Rates:</p>
        <p className="mt-0.5 text-foreground-muted">Last updated: 35 seconds ago</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {rates.map((rate) => (
          <div
            key={rate.code}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
          >
            <Flag code={rate.code} size={16} />
            <span className="whitespace-nowrap">{rate.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}