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
      <div className="relative">
        <UserAvatar name={name} />
        <span className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white">
          <Flag code={country} size={12} />
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-[#1F2640]">{name}</p>
        <p className="mt-0.5 text-[11px] text-[#9298AC]">{date}</p>
      </div>
    </div>
  );
}

export default function PendingTransactionsTable() {
  return (
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
          {pendingPayments.map((p, i) => (
            <tr key={i} className="border-t border-[#F0F2F7] text-[#434A61]">
              <td className="py-4 pr-4">
                <ClientCell name={p.client} country={p.country} date={p.date} />
              </td>
              <td className="py-4 pr-4">{p.transactionType}</td>
              <td className="py-4 pr-4">{p.paymentMethod}</td>
              <td className="py-4 pr-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="py-4 pr-4 text-[#9298AC]">{p.fees}</td>
              <td className="py-4 font-medium text-[#1F2640]">{p.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
