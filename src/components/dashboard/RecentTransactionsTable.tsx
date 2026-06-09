"use client";

import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Receipt,
} from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import EmptyState from "@/components/dashboard/EmptyState";
import Skeleton from "@/components/dashboard/Skeleton";
import {
  StatusBadge,
  UserAvatar,
  mergeClasses,
} from "@/components/dashboard/DashboardPrimitives";
import type { CountryCode } from "@/components/dashboard/dashboardData";
import { useTransactions } from "@/lib/dashboard/hooks";
import {
  toTransactionRow,
  type TransactionViewRow,
} from "@/lib/dashboard/transactionView";

function DirectionAvatar({
  name,
  country,
  direction,
}: {
  name: string;
  country: CountryCode | null;
  direction: "in" | "out" | "unknown";
}) {
  return (
    <div className="relative">
      <UserAvatar name={name} />
      {country ? (
        <span className="absolute -bottom-0.5 -right-0.5 ring-2 ring-white dark:ring-surface rounded-full">
          <Flag code={country} size={12} />
        </span>
      ) : null}
      {direction !== "unknown" ? (
        <span
          className={mergeClasses(
            "absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-surface",
            direction === "in"
              ? "bg-[#E8F8EF] text-[#1E9F72] dark:bg-[#0d2b20]"
              : "bg-[#FFEFEF] text-[#D95252] dark:bg-[#2e0808]",
          )}
          aria-hidden
        >
          {direction === "in" ? (
            <ArrowDownLeft className="h-2.5 w-2.5" strokeWidth={3} />
          ) : (
            <ArrowUpRight className="h-2.5 w-2.5" strokeWidth={3} />
          )}
        </span>
      ) : null}
    </div>
  );
}

function toCsv(rows: TransactionViewRow[]): string {
  const header = [
    "id",
    "reference",
    "currency",
    "amount",
    "direction",
    "status",
    "date",
  ];
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const body = rows.map((r) =>
    [
      r.id,
      r.reference,
      r.currency,
      String(r.amountNumeric),
      r.direction,
      r.rawStatus,
      r.date,
    ]
      .map((c) => esc(String(c)))
      .join(","),
  );
  return [header.join(","), ...body].join("\n");
}

function handleExport(rows: TransactionViewRow[]) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function RecentTransactionsTable() {
  const router = useRouter();
  const { data, isLoading, isError } = useTransactions();

  const rows = (data?.items ?? []).map(toTransactionRow).slice(0, 10);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Recent transactions
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => router.push("/dashboard/transactions")}
            className="font-medium text-primary-600 transition hover:text-primary-700"
          >
            View all
          </button>
          <button
            type="button"
            onClick={() => handleExport(rows)}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 text-foreground-muted transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" rounded="lg" />
          <Skeleton className="h-12 w-full" rounded="lg" />
          <Skeleton className="h-12 w-full" rounded="lg" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Transactions unavailable"
          description="We couldn't load your transactions right now. Please try again."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Once you start moving money, your recent activity will appear here."
          icon={<Receipt className="h-6 w-6" />}
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
                  onClick={() =>
                    router.push(`/dashboard/transactions/${row.id}`)
                  }
                  className="cursor-pointer border-t border-border text-foreground-muted transition hover:bg-surface-muted"
                >
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <DirectionAvatar
                        name={row.clientName}
                        country={row.country}
                        direction={row.direction}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {row.clientName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-foreground-muted">
                          {row.date}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">{row.type}</td>
                  <td className="py-3.5 pr-4">{row.paymentMethod}</td>
                  <td className="py-3.5 pr-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-3.5 pr-4 text-foreground-muted">
                    {row.fees}
                  </td>
                  <td
                    className={mergeClasses(
                      "py-3.5 font-medium",
                      row.direction === "in"
                        ? "text-[#1E9F72]"
                        : "text-foreground",
                    )}
                  >
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
