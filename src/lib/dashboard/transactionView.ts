import type { Transaction } from "@/lib/dashboard/api";
import type { CountryCode } from "@/components/dashboard/dashboardData";

const CURRENCY_TO_COUNTRY: Record<string, CountryCode> = {
  KES: "KE",
  NGN: "NG",
  GHS: "GH",
};

const STATUS_LABEL: Record<string, "Pending" | "Successful" | "Failed"> = {
  processing: "Pending",
  pending: "Pending",
  completed: "Successful",
  failed: "Failed",
  canceled: "Failed",
  frozen: "Failed",
};

export type TransactionViewRow = {
  id: string;
  rawId: number;
  clientName: string;
  country: CountryCode | null;
  date: string;
  direction: "in" | "out" | "unknown";
  type: string;
  paymentMethod: string;
  status: "Pending" | "Successful" | "Failed";
  rawStatus: string;
  fees: string;
  amount: string;
  amountNumeric: number;
  currency: string;
  reference: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
  })} • ${d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function formatAmount(value: string, currency: string, direction: string): string {
  const num = Number(value);
  if (Number.isNaN(num)) return `${currency} ${value}`;
  const sign = direction === "out" ? "-" : direction === "in" ? "+" : "";
  return `${sign}${currency} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(num))}`;
}

export function toTransactionRow(tx: Transaction): TransactionViewRow {
  const status = STATUS_LABEL[tx.status?.toLowerCase()] ?? "Pending";
  const reference = tx.external_order_id || tx.aggregator_order_id || `#${tx.id}`;
  const direction = tx.direction === "in" || tx.direction === "out"
    ? tx.direction
    : "unknown";
  const directionLabel =
    direction === "in" ? "Pay-in" : direction === "out" ? "Pay-out" : "Order";

  return {
    id: String(tx.id),
    rawId: tx.id,
    clientName: reference,
    country: CURRENCY_TO_COUNTRY[tx.currency?.toUpperCase()] ?? null,
    date: formatDate(tx.created_at),
    direction,
    type: directionLabel,
    paymentMethod: tx.wallet_address ? "Wallet" : "—",
    status,
    rawStatus: tx.status,
    fees: "—",
    amount: formatAmount(tx.amount_fiat, tx.currency, direction),
    amountNumeric: Number(tx.amount_fiat) || 0,
    currency: tx.currency,
    reference,
  };
}
