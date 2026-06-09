"use client";

import { Clock } from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import EmptyState from "@/components/dashboard/EmptyState";
import Skeleton from "@/components/dashboard/Skeleton";
import {
  StatusBadge,
  UserAvatar,
} from "@/components/dashboard/DashboardPrimitives";
import type { CountryCode } from "@/components/dashboard/dashboardData";
import { useTransactions } from "@/lib/dashboard/hooks";
import { toTransactionRow } from "@/lib/dashboard/transactionView";

function ClientWithDate({
  name,
  country,
  date,
}: {
  name: string;
  country: CountryCode | null;
  date: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative">
        <UserAvatar name={name} />
        {country ? (
          <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-surface rounded-full">
            <Flag code={country} size={12} />
          </span>
        ) : null}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="mt-0.5 text-[11px] text-foreground-muted">{date}</p>
      </div>
    </div>
  );
}

export default function PendingPaymentsTable() {
  const { data, isLoading, isError } = useTransactions();

  const rows = (data?.items ?? [])
    .filter((tx) => tx.status?.toLowerCase() === "processing")
    .map(toTransactionRow)
    .slice(0, 5);

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Pending payments</h3>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" rounded="lg" />
          <Skeleton className="h-12 w-full" rounded="lg" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Transactions unavailable"
          description="We couldn't load pending payments right now. Please try again."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Nothing pending"
          description="Transactions awaiting settlement will show up here."
          icon={<Clock className="h-6 w-6" />}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">Reference</th>
                <th className="pb-3 pr-4 font-medium">Txn type</th>
                <th className="pb-3 pr-4 font-medium">Payment method</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Fees</th>
                <th className="pb-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-border text-foreground-muted"
                >
                  <td className="py-4 pr-4">
                    <ClientWithDate
                      name={row.clientName}
                      country={row.country}
                      date={row.date}
                    />
                  </td>
                  <td className="py-4 pr-4">{row.type}</td>
                  <td className="py-4 pr-4">{row.paymentMethod}</td>
                  <td className="py-4 pr-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-4 pr-4 text-foreground-muted">{row.fees}</td>
                  <td className="py-4 font-medium text-foreground">
                    {row.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
