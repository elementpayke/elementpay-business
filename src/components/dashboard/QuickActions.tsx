"use client";

import { Send, Users, FileText, PiggyBank } from "lucide-react";

const actions = [
  {
    icon: Send,
    label: "Send Payment",
    description: "Send money to a single recipient directly",
    color: "bg-primary-500",
  },
  {
    icon: Users,
    label: "Bulk Payment",
    description: "Send payments to multiple recipients with a single action",
    color: "bg-secondary-500",
  },
  {
    icon: FileText,
    label: "Create Invoice",
    description: "Create and send professional invoices",
    color: "bg-tertiary-500",
  },
  {
    icon: PiggyBank,
    label: "Deposit Funds",
    description: "Fund your wallet or add direct operations directly",
    color: "bg-gray-900 dark:bg-gray-100",
  },
];

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Quick actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map(({ icon: Icon, label, description, color }) => (
          <button
            key={label}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors group"
          >
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white dark:text-gray-900" />
            </div>
            <div className="font-semibold text-sm mb-1 group-hover:text-primary-500 transition-colors">
              {label}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
              {description}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
