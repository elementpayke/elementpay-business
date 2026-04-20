"use client";

import { LayoutDashboard, ArrowLeftRight, Wallet, FileText, Store, Settings } from "lucide-react";

const tabs = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: ArrowLeftRight, label: "Transactions" },
  { icon: Wallet, label: "Wallets" },
  { icon: FileText, label: "Reports" },
  { icon: Store, label: "Merchant Ops", badge: "Pro" },
  { icon: Settings, label: "Settings" },
];

export default function DashboardTabs() {
  return (
    <nav className="flex items-center gap-1 px-6 pt-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {tabs.map(({ icon: Icon, label, active, badge }) => (
        <button
          key={label}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative ${
            active
              ? "bg-tertiary-500 text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
          {badge && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded">
              {badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
}
