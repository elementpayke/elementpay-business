"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  Wallet,
  CreditCard,
  Settings,
  Bell,
  Search,
  Globe,
  PieChart,
} from "lucide-react";
import { FadeIn } from "./FadeIn";

function FullDashboard() {
  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/10 overflow-hidden">
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50/80">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="text-[10px] text-gray-400 bg-gray-100 rounded px-3 py-0.5">
            business.elementpay.io
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 border-r border-gray-100 p-4 hidden md:block">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded bg-primary-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">E</span>
            </div>
            <span className="text-xs font-bold text-gray-800">ElementPay</span>
          </div>
          <div className="space-y-1">
            {[
              { icon: BarChart3, label: "Dashboard", active: true },
              { icon: Wallet, label: "Wallets" },
              { icon: ArrowUpRight, label: "Payments" },
              { icon: Globe, label: "Transfers" },
              { icon: CreditCard, label: "Cards" },
              { icon: PieChart, label: "Analytics" },
              { icon: Settings, label: "Settings" },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-medium ${
                  active
                    ? "bg-primary-50 text-primary-600"
                    : "text-gray-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-bold text-gray-800">Dashboard</p>
              <p className="text-[10px] text-gray-400">Welcome back, Alex</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-300" />
                <div className="bg-gray-50 rounded-lg pl-6 pr-3 py-1 text-[10px] text-gray-300 w-28">
                  Search...
                </div>
              </div>
              <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center relative">
                <Bell className="w-3 h-3 text-gray-400" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary-500 rounded-full" />
              </div>
              <div className="w-6 h-6 rounded-full bg-primary-200" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Total Balance", value: "$2,456,890", change: "+12.5%", up: true },
              { label: "Monthly Inflow", value: "$847,230", change: "+8.2%", up: true },
              { label: "Monthly Outflow", value: "$524,100", change: "-3.1%", up: false },
              { label: "Pending", value: "$18,450", change: "3 tx", up: true },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{stat.value}</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className={`w-2.5 h-2.5 ${stat.up ? "text-tertiary-500" : "text-secondary-400 rotate-180"}`} />
                  <span className={`text-[9px] font-medium ${stat.up ? "text-tertiary-500" : "text-secondary-400"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Activity */}
          <div className="grid grid-cols-3 gap-3">
            {/* Chart Area */}
            <div className="col-span-2 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold text-gray-600">Cash Flow</p>
                <div className="flex gap-1.5">
                  {["1W", "1M", "3M", "1Y"].map((t, i) => (
                    <span
                      key={t}
                      className={`text-[8px] px-1.5 py-0.5 rounded ${
                        i === 1 ? "bg-primary-500 text-white" : "text-gray-400"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              {/* SVG Chart */}
              <svg viewBox="0 0 300 80" className="w-full h-20" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="fullChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#413ACB" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#413ACB" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 60 C 20 55, 40 45, 60 50 C 80 55, 100 35, 120 30 C 140 25, 160 40, 180 35 C 200 30, 220 20, 240 15 C 260 10, 280 18, 300 12 L 300 80 L 0 80 Z"
                  fill="url(#fullChartGrad)"
                />
                <path
                  d="M 0 60 C 20 55, 40 45, 60 50 C 80 55, 100 35, 120 30 C 140 25, 160 40, 180 35 C 200 30, 220 20, 240 15 C 260 10, 280 18, 300 12"
                  fill="none"
                  stroke="#413ACB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[10px] font-semibold text-gray-600 mb-3">Recent</p>
              <div className="space-y-2.5">
                {[
                  { name: "Payroll", amount: "-$24.5K", type: "out" },
                  { name: "Client — Acme", amount: "+$18.7K", type: "in" },
                  { name: "AWS", amount: "-$3.2K", type: "out" },
                  { name: "Settlement", amount: "+$52.1K", type: "in" },
                ].map((tx) => (
                  <div key={tx.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${
                        tx.type === "in" ? "bg-tertiary-100" : "bg-gray-200"
                      }`}>
                        {tx.type === "in" ? (
                          <ArrowDownLeft className="w-2.5 h-2.5 text-tertiary-600" />
                        ) : (
                          <ArrowUpRight className="w-2.5 h-2.5 text-gray-500" />
                        )}
                      </div>
                      <span className="text-[9px] font-medium text-gray-600">{tx.name}</span>
                    </div>
                    <span className={`text-[9px] font-bold ${
                      tx.type === "in" ? "text-tertiary-600" : "text-gray-600"
                    }`}>
                      {tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardShowcase() {
  return (
    <section className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-sm font-semibold text-primary-500 uppercase tracking-widest mb-3">
            The Platform
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
            Your financial command center
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Every metric, every payment, every account — unified in a single
            dashboard built for speed and clarity.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="relative"
          >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-100/50 via-transparent to-transparent rounded-3xl blur-2xl -z-10 scale-105" />
            <FullDashboard />
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}
