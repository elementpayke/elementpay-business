"use client";

import { TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";

const miniTransactions = [
  { name: "Payroll — Engineering", amount: "-$24,500.00", type: "out", time: "2m ago" },
  { name: "Client Payment — Acme", amount: "+$18,750.00", type: "in", time: "15m ago" },
  { name: "Vendor — AWS", amount: "-$3,245.80", type: "out", time: "1h ago" },
  { name: "Settlement — EUR Pool", amount: "+$52,100.00", type: "in", time: "2h ago" },
];

function MiniChart() {
  const points = [40, 35, 45, 30, 50, 42, 60, 55, 70, 65, 80, 75, 90];
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min;
  const width = 200;
  const height = 60;

  const pathData = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * width;
      const y = height - ((p - min) / range) * height;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaPath = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#413ACB" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#413ACB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#chartGradient)" />
      <path d={pathData} fill="none" stroke="#413ACB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardMockup() {
  return (
    <div className="w-full rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-primary-500/10 overflow-hidden">
      {/* Title Bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-xs text-gray-400 bg-gray-100 rounded-md px-3 py-1">
            business.elementpay.io/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-5 space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Total Balance</p>
            <p className="text-lg font-bold text-gray-900 mt-1">$2.4M</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-tertiary-500" />
              <span className="text-[10px] font-medium text-tertiary-500">+12.5%</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Monthly Volume</p>
            <p className="text-lg font-bold text-gray-900 mt-1">$847K</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-tertiary-500" />
              <span className="text-[10px] font-medium text-tertiary-500">+8.2%</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Transactions</p>
            <p className="text-lg font-bold text-gray-900 mt-1">1,284</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-tertiary-500" />
              <span className="text-[10px] font-medium text-tertiary-500">+24.1%</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-gray-600">Revenue Overview</p>
            <div className="flex gap-2">
              <span className="text-[10px] text-primary-500 font-medium bg-primary-100 px-2 py-0.5 rounded-md">7D</span>
              <span className="text-[10px] text-gray-400 px-2 py-0.5">30D</span>
              <span className="text-[10px] text-gray-400 px-2 py-0.5">90D</span>
            </div>
          </div>
          <MiniChart />
        </div>

        {/* Transactions */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-600">Recent Activity</p>
          {miniTransactions.map((tx) => (
            <div key={tx.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  tx.type === "in" ? "bg-tertiary-100" : "bg-gray-100"
                }`}>
                  {tx.type === "in" ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 text-tertiary-600" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{tx.name}</p>
                  <p className="text-[10px] text-gray-400">{tx.time}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold ${
                tx.type === "in" ? "text-tertiary-600" : "text-gray-700"
              }`}>
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
