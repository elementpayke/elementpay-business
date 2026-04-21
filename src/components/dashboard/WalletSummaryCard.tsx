"use client";

import { ArrowRight, ChevronDown, EyeOff, Wallet } from "lucide-react";
import Flag from "@/components/dashboard/Flag";

function CoinsIllustration() {
  return (
    <svg viewBox="0 0 260 180" className="h-full w-full">
      <defs>
        <linearGradient id="coinFace" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFD3DD" />
          <stop offset="100%" stopColor="#FF9BAF" />
        </linearGradient>
        <linearGradient id="coinEdge" x1="0%" x2="0%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FF8AA3" />
          <stop offset="100%" stopColor="#E9617D" />
        </linearGradient>
      </defs>

      <ellipse cx="150" cy="160" rx="98" ry="14" fill="#F8E2E8" opacity="0.6" />

      {[
        { cx: 90, cy: 140 },
        { cx: 140, cy: 130 },
        { cx: 190, cy: 142 },
        { cx: 115, cy: 100 },
        { cx: 165, cy: 92 },
        { cx: 140, cy: 60 },
      ].map((c, i) => (
        <g key={i}>
          <ellipse cx={c.cx} cy={c.cy + 4} rx="28" ry="9" fill="url(#coinEdge)" />
          <ellipse cx={c.cx} cy={c.cy} rx="28" ry="9" fill="url(#coinFace)" />
          <text
            x={c.cx}
            y={c.cy + 3}
            textAnchor="middle"
            fill="#FFEDF1"
            fontSize="11"
            fontWeight="700"
          >
            $
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function WalletSummaryCard() {
  return (
    <section className="flex items-stretch gap-4">
      <div className="relative flex-1 overflow-hidden rounded-[20px] border border-[#ECEEF5] bg-[#FAFAFC] px-6 py-5">
        <div className="relative z-10 flex max-w-[440px] flex-col">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-[#7B8196]">Wallet name</p>
            <button className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E8F1] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#232B45] shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
              <Flag code="KE" size={16} />
              KES
              <ChevronDown className="h-3.5 w-3.5 text-[#9097AB]" />
            </button>
          </div>

          <p className="mt-3 text-xs text-[#8D92A6]">Wallet balance:</p>

          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <h2 className="text-[34px] font-bold leading-none tracking-[-0.03em] text-[#1A2138]">
              KES 3,354,114.81
            </h2>
            <button className="inline-flex items-center gap-1 text-sm text-primary-600 transition hover:text-primary-700">
              <EyeOff className="h-4 w-4" />
              Hide balance
            </button>
          </div>

          <p className="mt-2 text-sm text-[#8E93A7]">~ USD 26,000.89</p>

          <p className="mt-2 text-xs font-medium text-tertiary-600">
            @ 1 US Dollar = 129.00 Kenyan Shillings
          </p>

          <button className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:text-primary-700">
            View wallet details
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-0 right-2 h-[150px] w-[230px]">
          <CoinsIllustration />
        </div>
      </div>

      <button
        type="button"
        aria-label="Open wallet"
        className="flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-xl border border-[#E1DCFB] bg-white text-primary-500 shadow-[0_2px_6px_rgba(65,58,203,0.1)] transition hover:-translate-y-0.5 hover:bg-primary-50"
      >
        <Wallet className="h-4 w-4" />
      </button>
    </section>
  );
}
