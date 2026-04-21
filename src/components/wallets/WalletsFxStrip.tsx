"use client";

import Flag from "@/components/dashboard/Flag";

type Rate = {
  code: "KE" | "NG" | "GH";
  text: string;
  tone: string;
};

const RATES: Rate[] = [
  { code: "KE", text: "1 US Dollar = 129.00 Kenyan Shillings", tone: "text-[#1E9F72]" },
  { code: "NG", text: "1 US Dollar = 1,422.73 Nigerian Naira", tone: "text-[#1E9F72]" },
  { code: "GH", text: "1 US Dollar = 10.77508 Ghanaian Cedis", tone: "text-primary-600" },
];

export default function WalletsFxStrip() {
  return (
    <section className="space-y-3">
      <div className="text-xs">
        <p className="font-medium text-[#3F465E]">Jan 14, 2026 FX Rates:</p>
        <p className="mt-0.5 text-[#9298AC]">Last updated: 35 seconds ago</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {RATES.map((rate) => (
          <div
            key={rate.code}
            className="inline-flex items-center gap-2 rounded-full border border-[#E9ECF4] bg-white px-3 py-1.5 text-xs"
          >
            <span className="relative inline-flex">
              <Flag code="US" size={16} />
              <span className="absolute -right-1.5 -bottom-0.5">
                <Flag code={rate.code} size={12} />
              </span>
            </span>
            <span className={`whitespace-nowrap font-medium ${rate.tone}`}>{rate.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
