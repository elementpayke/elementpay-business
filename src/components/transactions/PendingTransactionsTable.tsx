"use client";

import Flag from "@/components/dashboard/Flag";
import { StatusBadge, UserAvatar } from "@/components/dashboard/DashboardPrimitives";
import {
  pendingPayments,
  type CountryCode,
} from "@/components/dashboard/dashboardData";

function ClientCell({
  name,
  country,
  date,
}: {
  name: string;
  country: CountryCode;
  date: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex-shrink-0">
        <UserAvatar name={name} />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#1A1D2E]">
          <Flag code={country} size={12} />
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-[#1F2640] dark:text-[#E0E5F5]">{name}</p>
        <p className="mt-0.5 text-[11px] text-[#9298AC] dark:text-[#5A6080]">{date}</p>
      </div>
    </div>
  );
}

function PendingCard({ p }: { p: (typeof pendingPayments)[number] }) {
  return (
    <div className="rounded-xl border border-[#F0F2F7] bg-[#FAFBFE] p-3.5 dark:border-[#252840] dark:bg-[#1A1D2E]">
      <div className="flex items-start justify-between gap-2">
        <ClientCell name={p.client} country={p.country} date={p.date} />
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-semibold text-[#1F2640] dark:text-[#E0E5F5]">{p.amount}</p>
          <div className="mt-1 flex justify-end">
            <StatusBadge status={p.status} />
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8D92A6] dark:text-[#5A6080]">
        <span>{p.transactionType}</span>
        <span className="text-[#D5D9E8] dark:text-[#2A3050]">·</span>
        <span>{p.paymentMethod}</span>
        <span className="text-[#D5D9E8] dark:text-[#2A3050]">·</span>
        <span>Fee: {p.fees}</span>
      </div>
    </div>
  );
}

export default function PendingTransactionsTable() {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium text-[#9298AC] dark:text-[#4A5070]">
              <th className="pb-3 pr-4 font-medium">Client name</th>
              <th className="pb-3 pr-4 font-medium">Txn type</th>
              <th className="pb-3 pr-4 font-medium">Payment method</th>
              <th className="pb-3 pr-4 font-medium">Txn status</th>
              <th className="pb-3 pr-4 font-medium">Fees</th>
              <th className="pb-3 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {pendingPayments.map((p, i) => (
              <tr
                key={i}
                className="border-t border-[#F0F2F7] dark:border-[#252840]"
              >
                <td className="py-4 pr-4">
                  <ClientCell name={p.client} country={p.country} date={p.date} />
                </td>
                <td className="py-4 pr-4 text-[#434A61] dark:text-[#8B92B2]">{p.transactionType}</td>
                <td className="py-4 pr-4 text-[#434A61] dark:text-[#8B92B2]">{p.paymentMethod}</td>
                <td className="py-4 pr-4">
                  <StatusBadge status={p.status} />
                </td>
                <td className="py-4 pr-4 text-[#9298AC] dark:text-[#5A6080]">{p.fees}</td>
                <td className="py-4 font-medium text-[#1F2640] dark:text-[#E0E5F5]">{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-2 md:hidden">
        {pendingPayments.map((p, i) => (
          <PendingCard key={i} p={p} />
        ))}
      </div>
    </>
  );
}
