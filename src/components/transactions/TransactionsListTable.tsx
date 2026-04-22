"use client";

import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import {
  StatusBadge,
  UserAvatar,
  mergeClasses,
} from "@/components/dashboard/DashboardPrimitives";
import type {
  CountryCode,
  RecentTransactionRow,
} from "@/components/dashboard/dashboardData";

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
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white">
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

export default function TransactionsListTable({
  rows,
}: {
  rows: RecentTransactionRow[];
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E7EAF3] bg-[#FAFBFE] py-14 text-center text-sm text-[#8D92A6]">
        No transactions match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
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
          {rows.map((t) => (
            <tr
              key={t.id}
              onClick={() => router.push(`/dashboard/transactions/${t.id}`)}
              className="cursor-pointer border-t border-[#F0F2F7] text-[#434A61] transition hover:bg-[#FAFBFE]"
            >
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
  );
}
