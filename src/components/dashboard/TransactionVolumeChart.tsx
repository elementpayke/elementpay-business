"use client";

import { ChevronDown } from "lucide-react";

const monthlyData = [
  { month: "Jan", value: 65 },
  { month: "Feb", value: 45 },
  { month: "Mar", value: 75 },
  { month: "Apr", value: 50 },
  { month: "May", value: 85 },
  { month: "Jun", value: 60 },
  { month: "Jul", value: 40 },
  { month: "Aug", value: 70 },
  { month: "Sep", value: 55 },
  { month: "Oct", value: 90 },
  { month: "Nov", value: 0 },
  { month: "Dec", value: 0 },
];

const topCurrencies = [
  { flag: "🇰🇪", name: "Kenyan Shillings, KES", amount: "USD 45,230" },
  { flag: "🇳🇬", name: "Nigerian Naira, NGN", amount: "USD 31,020" },
  { flag: "🇬🇭", name: "Ghanaian Cedis, GHR", amount: "USD 28,783" },
];

export default function TransactionVolumeChart() {
  const maxValue = Math.max(...monthlyData.map((d) => d.value));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Transaction Volume Chart</h3>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-secondary-500" />
                Money in
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                Money out
              </div>
            </div>
          </div>
          <button className="flex items-center gap-1 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            This year
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Y-axis labels + bars */}
        <div className="flex gap-2">
          <div className="flex flex-col justify-between text-xs text-gray-400 pr-2 py-1" style={{ height: 200 }}>
            <span>$1k</span>
            <span>$9k</span>
            <span>$8k</span>
            <span>$7k</span>
            <span>$6k</span>
            <span>$0</span>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2" style={{ height: 200 }}>
            {monthlyData.map((d) => (
              <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full max-w-8 rounded-t-md bg-secondary-400 dark:bg-secondary-500 transition-all"
                  style={{ height: maxValue ? `${(d.value / maxValue) * 160}px` : "0px" }}
                />
                <span className="text-[10px] text-gray-400 mt-1">{d.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top currencies */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Top Transaction Currencies</h3>
          <button className="text-xs text-primary-500 hover:text-primary-600 transition-colors">
            See more
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {topCurrencies.map((c) => (
            <div
              key={c.name}
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.flag}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
              </div>
              <span className="text-sm font-semibold text-tertiary-600 dark:text-tertiary-400">
                {c.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
