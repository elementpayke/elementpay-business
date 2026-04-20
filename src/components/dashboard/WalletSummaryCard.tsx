"use client";

import { ChevronDown, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export default function WalletSummaryCard() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">Wallet name</span>
            <button className="flex items-center gap-1 text-sm font-medium bg-tertiary-500 text-white px-3 py-1 rounded-full">
              KES
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-3">KES Wallet</div>

          <div className="text-3xl font-bold mb-2">KES 3,354,114.81</div>

          <div className="flex items-center gap-3 text-sm mb-1">
            <div className="flex items-center gap-1 text-tertiary-500">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+$62 today</span>
              <span>(+2%)</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">
            ≈ USD 25,939.52
          </div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingDown className="w-3 h-3 text-red-500" />
            <span className="text-red-500">KES 0.5%</span>
            <span className="text-gray-400"> -$20.00 Current Dillings</span>
          </div>

          <button className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 font-medium mt-4 transition-colors">
            View wallet details
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Decorative illustration */}
        <div className="w-32 h-28 flex items-center justify-center opacity-30">
          <svg viewBox="0 0 120 100" className="w-full h-full text-secondary-500">
            <ellipse cx="60" cy="70" rx="55" ry="25" fill="currentColor" opacity="0.3" />
            <rect x="25" y="20" width="70" height="45" rx="8" fill="currentColor" opacity="0.5" />
            <circle cx="75" cy="35" r="8" fill="currentColor" opacity="0.7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
