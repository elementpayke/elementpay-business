"use client";

import Flag from "@/components/dashboard/Flag";
import { StatusBadge, UserAvatar } from "@/components/dashboard/DashboardPrimitives";
import { upcomingInvoices, type CountryCode } from "@/components/dashboard/dashboardData";

function ClientCell({ name, country }: { name: string; country: CountryCode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <UserAvatar name={name} />
        <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-surface rounded-full">
          <Flag code={country} size={12} />
        </span>
      </div>
      <span className="text-sm text-foreground">{name}</span>
    </div>
  );
}

export default function UpcomingInvoicesTable() {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Upcoming invoice payments</h3>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead>
            <tr className="text-left text-[11px] font-medium text-foreground-muted">
              <th className="pb-3 pr-4 font-medium">Client name</th>
              <th className="pb-3 pr-4 font-medium">Receiving wallet</th>
              <th className="pb-3 pr-4 font-medium">Invoice ID</th>
              <th className="pb-3 pr-4 font-medium">Timestamp</th>
              <th className="pb-3 pr-4 font-medium">Transaction ID</th>
              <th className="pb-3 pr-4 font-medium">Due date</th>
              <th className="pb-3 pr-4 font-medium">Invoice status</th>
              <th className="pb-3 font-medium">Expected amount</th>
            </tr>
          </thead>
          <tbody>
            {upcomingInvoices.map((invoice, i) => (
              <tr key={i} className="border-t border-border text-foreground-muted">
                <td className="py-4 pr-4 align-middle">
                  <ClientCell name={invoice.client} country={invoice.country} />
                </td>
                <td className="py-4 pr-4">
                  <button className="text-primary-600 underline underline-offset-2 hover:text-primary-700">
                    {invoice.wallet}
                  </button>
                </td>
                <td className="py-4 pr-4">{invoice.invoiceId}</td>
                <td className="py-4 pr-4">{invoice.timestamp}</td>
                <td className="py-4 pr-4">{invoice.transactionId}</td>
                <td className="py-4 pr-4">{invoice.dueDate}</td>
                <td className="py-4 pr-4">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="py-4 font-medium text-foreground">{invoice.expectedAmount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}