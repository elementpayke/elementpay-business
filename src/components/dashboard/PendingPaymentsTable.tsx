"use client";

import Flag from "@/components/dashboard/Flag";
import { StatusBadge, UserAvatar } from "@/components/dashboard/DashboardPrimitives";
import { pendingPayments, type CountryCode } from "@/components/dashboard/dashboardData";

function ClientWithDate({
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
        <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-surface rounded-full">
          <Flag code={country} size={12} />
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="mt-0.5 text-[11px] text-foreground-muted">{date}</p>
      </div>
    </div>
  );
}

export default function PendingPaymentsTable() {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Pending payments</h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium text-foreground-muted">
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
              <tr key={i} className="border-t border-border text-foreground-muted">
                <td className="py-4 pr-4">
                  <ClientWithDate name={p.client} country={p.country} date={p.date} />
                </td>
                <td className="py-4 pr-4">{p.transactionType}</td>
                <td className="py-4 pr-4">{p.paymentMethod}</td>
                <td className="py-4 pr-4">
                  <StatusBadge status={p.status} />
                </td>
                <td className="py-4 pr-4 text-foreground-muted">{p.fees}</td>
                <td className="py-4 font-medium text-foreground">{p.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}