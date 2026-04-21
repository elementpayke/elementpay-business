"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { mergeClasses, StatusBadge } from "@/components/dashboard/DashboardPrimitives";

export type WalletTransaction = {
  id: string;
  date: string;
  type: string;
  rail: string;
  amount: string;
  direction: "in" | "out";
  status: "Completed" | "Pending" | "Failed";
  reference: string;
};

type Filter = "all" | "in" | "out" | "Failed" | "Pending";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in", label: "Incoming" },
  { key: "out", label: "Outgoing" },
  { key: "Failed", label: "Failed" },
  { key: "Pending", label: "Pending" },
];

export default function WalletTransactionsList({
  transactions,
}: {
  transactions: WalletTransaction[];
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    if (filter === "in" || filter === "out") {
      return transactions.filter((t) => t.direction === filter);
    }
    return transactions.filter((t) => t.status === filter);
  }, [transactions, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={mergeClasses(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === f.key
                ? "border-primary-200 bg-primary-100/60 text-primary-700"
                : "border-[#E8EAF2] bg-white text-[#7D8398] hover:border-[#CDD2E0] hover:text-[#2A3150]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E1E4EE] bg-[#FAFBFE] px-5 py-12 text-center">
          <p className="text-sm font-medium text-[#1A2138]">No transactions yet</p>
          <p className="mt-1 text-xs text-[#8E93A7]">
            On-chain activity for this wallet will appear here once you start sending or receiving USDC.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#ECEEF5]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAFBFE] text-xs font-medium uppercase tracking-[0.06em] text-[#8E93A7]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Rail</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF5]">
              {filtered.map((t) => (
                <tr key={t.id} className="bg-white">
                  <td className="px-4 py-3 text-[#4D556C]">{t.date}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 font-medium text-[#1A2138]">
                      {t.direction === "in" ? (
                        <ArrowDownLeft className="h-3.5 w-3.5 text-tertiary-600" />
                      ) : (
                        <ArrowUpRight className="h-3.5 w-3.5 text-secondary-400" />
                      )}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#4D556C]">{t.rail}</td>
                  <td className="px-4 py-3 font-medium text-[#1A2138]">{t.amount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3 text-[#4D556C]">{t.reference}</td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="bg-white px-4 py-10 text-center text-sm text-[#8E93A7]">
                    No transactions match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
