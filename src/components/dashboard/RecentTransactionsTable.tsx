"use client";

import { ArrowDownLeft, ArrowUpRight, Download, SlidersHorizontal, X } from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import { StatusBadge, UserAvatar, mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import { recentTransactions, type CountryCode } from "@/components/dashboard/dashboardData";

const chips = [
  { label: "Pay-out", active: true },
  { label: "Single payment", active: true },
  { label: "Failed", active: true },
];

function DirectionAvatar({
  name,
  country,
  direction,
}: {
  name: string;
  country: CountryCode;
  direction: "in" | "out";
}) {
  return (
    <div className="relative">
      <UserAvatar name={name} />
      <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white rounded-full">
        <Flag code={country} size={12} />
      </span>
      <span
        className={mergeClasses(
          "absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white",
          direction === "in" ? "bg-[#E8F8EF] text-[#1E9F72]" : "bg-[#FFEFEF] text-[#D95252]",
        )}
        aria-hidden
      >
        {direction === "in" ? (
          <ArrowDownLeft className="h-2.5 w-2.5" strokeWidth={3} />
        ) : (
          <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={3} />
        )}
      </span>
    </div>
  );
}

export default function RecentTransactionsTable() {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#3F465E]">Recent transactions</h3>
        <div className="flex items-center gap-4 text-sm">
          <button className="font-medium text-primary-600 transition hover:text-primary-700">
            View all
          </button>
          <button className="inline-flex items-center gap-1.5 text-[#677089] transition hover:text-[#222945]">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="inline-flex items-center gap-2 rounded-full border border-[#E7EAF3] bg-white px-3 py-1.5 text-xs font-medium text-[#677089] transition hover:border-[#D6DBEA] hover:text-[#222945]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter
        </button>
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-100/60 px-3 py-1.5 text-xs font-medium text-primary-700"
          >
            {chip.label}
            <button
              type="button"
              aria-label={`Remove ${chip.label} filter`}
              className="text-primary-600/70 transition hover:text-primary-700"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button className="text-xs font-medium text-[#9CA3B6] transition hover:text-[#2B324B]">
          Clear all
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium text-[#9298AC]">
              <th className="pb-3 pr-4 font-medium">Client name</th>
              <th className="pb-3 pr-4 font-medium">Txn type</th>
              <th className="pb-3 pr-4 font-medium">Payment method</th>
              <th className="pb-3 pr-4 font-medium">Txn status</th>
              <th className="pb-3 pr-4 font-medium">Fees</th>
              <th className="pb-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((t, i) => (
              <tr key={i} className="border-t border-[#F0F2F7] text-[#434A61]">
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <DirectionAvatar
                      name={t.client}
                      country={t.country}
                      direction={t.direction}
                    />
                    <div>
                      <p className="text-sm font-medium text-[#1F2640]">{t.client}</p>
                      <p className="mt-0.5 text-[11px] text-[#9298AC]">{t.date}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4">{t.type}</td>
                <td className="py-3.5 pr-4">{t.paymentMethod}</td>
                <td className="py-3.5 pr-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-3.5 pr-4 text-[#9298AC]">{t.fees}</td>
                <td
                  className={mergeClasses(
                    "py-3.5 font-medium",
                    t.amount.startsWith("-") ? "text-[#1F2640]" : "text-[#1E9F72]",
                  )}
                >
                  {t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
