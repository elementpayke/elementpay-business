import { authedFetch } from "@/lib/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  const body = await res.json().catch(() => null);
  return (body?.data ?? body) as T;
}

export type ExchangeRates = {
  base: string;
  rates: Record<string, number>;
};

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const res = await fetch(`${API_BASE}/api/v1/exchange-rates`, {
    headers: { "Content-Type": "application/json" },
  });
  return unwrap<ExchangeRates>(res);
}

export type DashboardTotals = {
  money_in_30d: string;
  money_out_30d: string;
  pending_count: number;
  user_balance: string | null;
};

export type DashboardSummary = {
  totals: DashboardTotals;
  fx_rates: ExchangeRates;
};

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await authedFetch(`${API_BASE}/api/v1/dashboard/summary`);
  return unwrap<DashboardSummary>(res);
}

export type Transaction = {
  id: number;
  direction: "in" | "out" | "unknown";
  status: string;
  amount_fiat: string;
  currency: string;
  aggregator_order_id: string | null;
  external_order_id: string | null;
  wallet_address: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TransactionList = {
  items: Transaction[];
  total: number;
};

export async function fetchTransactions(): Promise<TransactionList> {
  const res = await authedFetch(`${API_BASE}/api/v1/transactions`);
  return unwrap<TransactionList>(res);
}

export class TransactionNotFoundError extends Error {
  constructor(message = "Transaction not found.") {
    super(message);
    this.name = "TransactionNotFoundError";
  }
}

export async function fetchTransaction(id: number | string): Promise<Transaction> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/transactions/${encodeURIComponent(String(id))}`,
  );
  if (res.status === 404) {
    throw new TransactionNotFoundError();
  }
  return unwrap<Transaction>(res);
}

export type InvoiceRecord = {
  id: number;
  business_id: number;
  draft_id: number | null;
  invoice_number: string;
  status: string;
  payload: Record<string, unknown>;
  send_via: string | null;
  sent_at: string | null;
  paid_at: string | null;
  public_token: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type InvoiceListResponse = {
  items: InvoiceRecord[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchInvoices(params: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<InvoiceListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  const qs = search.toString();
  const res = await authedFetch(
    `${API_BASE}/api/v1/invoices${qs ? `?${qs}` : ""}`,
  );
  return unwrap<InvoiceListResponse>(res);
}
