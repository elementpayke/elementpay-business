"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import EmptyState from "@/components/dashboard/EmptyState";
import Skeleton from "@/components/dashboard/Skeleton";
import {
  StatusBadge,
  UserAvatar,
} from "@/components/dashboard/DashboardPrimitives";
import type { CountryCode } from "@/components/dashboard/dashboardData";
import { useInvoices } from "@/lib/dashboard/hooks";
import type { InvoiceRecord } from "@/lib/dashboard/api";

type Row = {
  key: string;
  invoiceNumber: string;
  clientName: string;
  country: CountryCode | null;
  walletLabel: string;
  timestamp: string;
  dueDate: string;
  status: "Pending" | "Defaulting";
  expectedAmount: string;
};

const SUPPORTED_FLAGS: CountryCode[] = ["KE", "NG", "GH"];

function normalizeCountry(value: unknown): CountryCode | null {
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return SUPPORTED_FLAGS.includes(upper as CountryCode)
    ? (upper as CountryCode)
    : null;
}

function pick(payload: Record<string, unknown>, key: string): unknown {
  if (key in payload) return payload[key];
  return undefined;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDueDate(due: string | null | undefined): string {
  if (!due) return "—";
  const d = new Date(due);
  if (Number.isNaN(d.getTime())) return due;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatExpectedAmount(payload: Record<string, unknown>): string {
  const totals = pick(payload, "totals");
  const currency = (pick(payload, "currency") as string | undefined) ?? "USD";
  let amount: number | null = null;
  if (totals && typeof totals === "object") {
    const total = (totals as Record<string, unknown>).total;
    if (typeof total === "number") amount = total;
    else if (typeof total === "string") amount = Number(total);
  }
  if (amount == null || Number.isNaN(amount)) return "—";
  return `${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

function toRow(invoice: InvoiceRecord): Row {
  const payload = invoice.payload || {};
  const billerOrClient =
    (pick(payload, "client") as Record<string, unknown> | undefined) ?? null;
  const clientName =
    (billerOrClient?.fullName as string | undefined) ||
    (pick(payload, "client_name") as string | undefined) ||
    "Client";
  const country = normalizeCountry(
    billerOrClient?.country && typeof billerOrClient.country === "object"
      ? (billerOrClient.country as Record<string, unknown>).code
      : null,
  );
  const wallet =
    ((pick(payload, "invoice") as Record<string, unknown> | undefined)
      ?.receivingWalletId as string | undefined) ?? "—";
  const due =
    ((pick(payload, "invoice") as Record<string, unknown> | undefined)
      ?.dueDate as string | undefined) ??
    (pick(payload, "due_date") as string | undefined) ??
    null;
  const now = new Date();
  const dueDate = due ? new Date(due) : null;
  const overdue =
    !invoice.paid_at && dueDate && !Number.isNaN(dueDate.getTime())
      ? dueDate.getTime() < now.getTime()
      : false;

  return {
    key: String(invoice.id),
    invoiceNumber: invoice.invoice_number,
    clientName,
    country,
    walletLabel: wallet || "—",
    timestamp: formatTimestamp(invoice.created_at),
    dueDate: formatDueDate(due),
    status: overdue ? "Defaulting" : "Pending",
    expectedAmount: formatExpectedAmount(payload),
  };
}

function ClientCell({
  name,
  country,
}: {
  name: string;
  country: CountryCode | null;
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
      <span className="text-sm text-foreground">{name}</span>
    </div>
  );
}

export default function UpcomingInvoicesTable() {
  const { data, isLoading, isError } = useInvoices({
    status: "issued",
    limit: 10,
  });

  const rows = (data?.items ?? [])
    .filter((inv) => inv.paid_at == null)
    .slice(0, 5)
    .map(toRow);

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">
        Upcoming invoice payments
      </h3>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" rounded="lg" />
          <Skeleton className="h-12 w-full" rounded="lg" />
        </div>
      ) : isError ? (
        <EmptyState
          title="Invoices unavailable"
          description="We couldn't load invoices right now. Please try again."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No upcoming invoices"
          description="Issued invoices awaiting payment will appear here."
          icon={<FileText className="h-6 w-6" />}
          action={
            <Link
              href="/dashboard/invoices/create"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-105"
            >
              Create invoice
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="text-left text-[11px] font-medium text-foreground-muted">
                <th className="pb-3 pr-4 font-medium">Client name</th>
                <th className="pb-3 pr-4 font-medium">Receiving wallet</th>
                <th className="pb-3 pr-4 font-medium">Invoice number</th>
                <th className="pb-3 pr-4 font-medium">Issued</th>
                <th className="pb-3 pr-4 font-medium">Due date</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Expected amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-t border-border text-foreground-muted"
                >
                  <td className="py-4 pr-4 align-middle">
                    <ClientCell name={row.clientName} country={row.country} />
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-foreground">{row.walletLabel}</span>
                  </td>
                  <td className="py-4 pr-4">{row.invoiceNumber}</td>
                  <td className="py-4 pr-4">{row.timestamp}</td>
                  <td className="py-4 pr-4">{row.dueDate}</td>
                  <td className="py-4 pr-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="py-4 font-medium text-foreground">
                    {row.expectedAmount}
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
