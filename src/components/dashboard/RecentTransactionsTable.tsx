"use client";

import { Filter, Download } from "lucide-react";

const transactions = [
  {
    client: "Ayo Vikash",
    date: "Dec 5 - 12:00m",
    type: "Single payment",
    method: "M-Pesa Mobile",
    status: "Successful",
    txDate: "01/1/01/19",
    amount: "+KES 8,991",
  },
  {
    client: "Sara O'Johnson",
    date: "Dec 5 - 12:00m",
    type: "Invoice payo",
    method: "Bank transfer",
    status: "Cancelled",
    txDate: "01/1/1/41",
    amount: "+NGN 2,204",
  },
  {
    client: "Ally Makena",
    date: "Dec 5 - 12:00m",
    type: "Bulk payment",
    method: "Bank transfer",
    status: "Successful",
    txDate: "01/1/01/19",
    amount: "+KES 8,991",
  },
  {
    client: "David Machit",
    date: "Dec 5 - 12:00m",
    type: "Deposit",
    method: "Bank transfer",
    status: "Failed",
    txDate: "1/0/5/1/1/41",
    amount: "-GHS 1,456",
  },
  {
    client: "Susan Okarrisar",
    date: "Dec 5 - 12:00m",
    type: "Single payment",
    method: "Bank transfer",
    status: "Successful",
    txDate: "1/1/3/01/19",
    amount: "+NGN 1,991",
  },
  {
    client: "David Machit",
    date: "Dec 5 - 12:00m",
    type: "Invoice payo",
    method: "M1 Mobile",
    status: "Cancelled",
    txDate: "1/1/5/1/41",
    amount: "+GHS 4,244",
  },
  {
    client: "Ayo Vikash",
    date: "Dec 5 - 12:00m",
    type: "Single payment",
    method: "M-Pesa Mobile",
    status: "Successful",
    txDate: "01/1/01/19",
    amount: "+KES 8,991",
  },
  {
    client: "Sara O'Johnson",
    date: "Dec 5 - 12:00m",
    type: "Single payment",
    method: "Bank transfer",
    status: "Cancelled",
    txDate: "01/1/01/19",
    amount: "+NGN 2,204",
  },
  {
    client: "Ayo Vikash",
    date: "Dec 5 - 12:00m",
    type: "Single payment",
    method: "Bank transfer",
    status: "Successful",
    txDate: "01/1/01/19",
    amount: "+KES 8,991",
  },
];

const statusStyles: Record<string, string> = {
  Successful: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function RecentTransactionsTable() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Recent transactions</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <button className="flex items-center gap-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
              <th className="pb-3 pr-4 font-medium">Client name</th>
              <th className="pb-3 pr-4 font-medium">Txn type</th>
              <th className="pb-3 pr-4 font-medium">Payment method</th>
              <th className="pb-3 pr-4 font-medium">Txn status</th>
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-semibold text-primary-600 dark:text-primary-300">
                      {t.client
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium">{t.client}</div>
                      <div className="text-[11px] text-gray-400">{t.date}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{t.type}</td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{t.method}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[t.status] ?? ""}`}>
                    {t.status}
                  </span>
                </td>
                <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{t.txDate}</td>
                <td className={`py-3 font-medium ${t.amount.startsWith("-") ? "text-red-500" : "text-tertiary-600 dark:text-tertiary-400"}`}>
                  {t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
