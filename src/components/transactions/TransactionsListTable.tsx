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
    <div className="relative flex-shrink-0">
      <UserAvatar name={name} />
      <span className="absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-white dark:ring-[#1A1D2E]">
        <Flag code={country} size={12} />
      </span>
      <span
        className={mergeClasses(
          "absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-[#1A1D2E]",
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

function TransactionCard({
  t,
  onClick,
}: {
  t: RecentTransactionRow;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-[#F0F2F7] bg-[#FAFBFE] p-3.5 text-left transition active:scale-[0.99] hover:border-[#DDE0EE] dark:border-[#252840] dark:bg-[#1A1D2E] dark:hover:border-[#3A4060]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <DirectionAvatar name={t.client} country={t.country} direction={t.direction} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[#1F2640] dark:text-[#E0E5F5]">
              {t.client}
            </p>
            <p className="mt-0.5 text-[11px] text-[#9298AC] dark:text-[#5A6080]">{t.date}</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p
            className={mergeClasses(
              "text-sm font-semibold",
              t.amount.startsWith("-")
                ? "text-[#1F2640] dark:text-[#E0E5F5]"
                : "text-[#1E9F72] dark:text-[#2ED493]",
            )}
          >
            {t.amount}
          </p>
          <div className="mt-1 flex justify-end">
            <StatusBadge status={t.status} />
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#8D92A6] dark:text-[#5A6080]">
        <span>{t.type}</span>
        <span className="text-[#D5D9E8] dark:text-[#2A3050]">·</span>
        <span>{t.paymentMethod}</span>
        <span className="text-[#D5D9E8] dark:text-[#2A3050]">·</span>
        <span>Fee: {t.fees}</span>
      </div>
    </button>
  );
}

export default function TransactionsListTable({ rows }: { rows: RecentTransactionRow[] }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E7EAF3] bg-[#FAFBFE] py-12 text-center text-sm text-[#8D92A6] dark:border-[#2A3050] dark:bg-[#161928] dark:text-[#5A6080]">
        No transactions match the current filters.
      </div>
    );
  }

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
            {rows.map((t) => (
              <tr
                key={t.id}
                onClick={() => router.push(`/dashboard/transactions/${t.id}`)}
                className="cursor-pointer border-t border-[#F0F2F7] transition hover:bg-[#FAFBFE] dark:border-[#252840] dark:hover:bg-[#1A1D2E]"
              >
                <td className="py-3.5 pr-4">
                  <div className="flex items-center gap-2.5">
                    <DirectionAvatar name={t.client} country={t.country} direction={t.direction} />
                    <div>
                      <p className="text-sm font-medium text-[#1F2640] dark:text-[#E0E5F5]">{t.client}</p>
                      <p className="mt-0.5 text-[11px] text-[#9298AC] dark:text-[#5A6080]">{t.date}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 pr-4 text-[#434A61] dark:text-[#8B92B2]">{t.type}</td>
                <td className="py-3.5 pr-4 text-[#434A61] dark:text-[#8B92B2]">{t.paymentMethod}</td>
                <td className="py-3.5 pr-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-3.5 pr-4 text-[#9298AC] dark:text-[#5A6080]">{t.fees}</td>
                <td
                  className={mergeClasses(
                    "py-3.5 font-medium",
                    t.amount.startsWith("-")
                      ? "text-[#1F2640] dark:text-[#E0E5F5]"
                      : "text-[#1E9F72] dark:text-[#2ED493]",
                  )}
                >
                  {t.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col gap-2 md:hidden">
        {rows.map((t) => (
          <TransactionCard
            key={t.id}
            t={t}
            onClick={() => router.push(`/dashboard/transactions/${t.id}`)}
          />
        ))}
      </div>
    </>
  );
}
