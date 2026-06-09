import { authedFetch } from "@/lib/authedFetch";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export class OrderApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "OrderApiError";
    this.status = status;
    this.body = body;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    const detail =
      (body as { message?: string; detail?: unknown; error?: string })?.message ||
      (body as { detail?: unknown })?.detail ||
      (body as { error?: string })?.error ||
      `Request failed (${res.status})`;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg ?? "").join(", ")
          : "Request failed";
    throw new OrderApiError(message, res.status, body);
  }
  return body as T;
}

// 0 = OnRamp (fiat → crypto, deposit), 1 = OffRamp (crypto → fiat, send)
export type OrderTypeCode = 0 | 1;
export type OrderTypeName = "OnRamp" | "OffRamp";

export type CashoutType = "PHONE" | "TILL" | "PAYBILL" | "BANK" | "COFFEE_REDEEM";

// ---- Quote --------------------------------------------------------------

export type QuoteOrderIn = {
  amount_fiat: string;
  token: string;
  order_type: OrderTypeCode;
  currency: string;
  wallet_address: string;
};

export type QuoteOrderOut = {
  required_token_amount: string;
  required_token_amount_raw: number;
  fee_amount: string;
  effective_rate: string;
  fiat_amount: string;
  currency: string;
  token: string;
  order_type: OrderTypeName;
};

type QuoteResponseEnvelope = {
  status: string;
  message: string;
  data: QuoteOrderOut;
};

// ---- Create -------------------------------------------------------------

export type FiatPayloadIn = {
  amount_fiat: string;
  cashout_type: CashoutType;
  currency: string;
  phone_number?: string;
  till_number?: string;
  paybill_number?: string;
  account_number?: string;
  bank_code?: string;
  reference?: string;
  narrative?: string;
  metadata?: Record<string, string>;
};

export type OrderCreateIn = {
  user_address: string;
  token: string;
  order_type: OrderTypeCode;
  fiat_payload: FiatPayloadIn;
  external_order_id?: string;
  end_user_wallet_id?: number;
  mboka_user_ref?: string;
};

export type OrderCreateOut = {
  merchant_order_id: number;
  aggregator_order_id: string;
  client_ref: string;
  status: string;
  checkout_url: string | null;
};

type CreateResponseEnvelope = {
  status: string;
  message: string;
  data: OrderCreateOut;
};

// ---- New two-step quote / accept shape ---------------------------------
// Matches Mboka's `OrderQuoteIn` / `OrderQuoteOut` / `OrderAcceptOut`
// schemas (see ORDER_FLOW.md). The legacy QuoteOrderIn above is still
// accepted by /v1/orders/quote (Pydantic union) but does NOT return a
// quote_id — you need this shape to reach /accept and actually create
// an order.

export type AccountBlock = {
  /** Rail type. Today: "momo". Future: "bank", "till", "paybill". */
  accountType: string;
  /** E.164 phone for momo, account number for bank. */
  accountNumber: string;
  /** Holder name on the account. */
  accountName: string;
};

export type PIIBlock = {
  name?: string;
  phone?: string;
  /** ISO 3166-1 alpha-2. */
  country?: string;
  address?: string;
  /** DD/MM/YYYY. */
  dob?: string;
  email?: string;
  idNumber?: string;
  /** One of "passport" | "national_id" | "drivers_license". */
  idType?: string;
};

type OrderQuoteCommon = {
  /** ERC-20 contract address (e.g. USDC on Base). */
  token: string;
  /** ISO 4217 fiat code. */
  currency: string;
  /** ISO 3166-1 alpha-2 country of the fiat rail. */
  country: string;
  end_user_wallet_id?: number;
  external_order_id?: string;
  mboka_user_ref?: string;
};

export type OrderQuoteOnRampIn = OrderQuoteCommon & {
  order_type: "OnRamp";
  /** Decimal string. Amount of fiat the customer will pay. */
  local_amount: string;
  /** EVM address that receives crypto on settlement. */
  wallet_address: string;
  source: AccountBlock;
  /** Optional — Mboka fills missing fields from KYC. */
  recipient?: PIIBlock;
};

export type OrderQuoteOffRampIn = OrderQuoteCommon & {
  order_type: "OffRamp";
  /** Decimal string. Amount of crypto the customer will send. */
  crypto_amount: string;
  /** EVM address for refund on failure. */
  refund_address: string;
  destination: AccountBlock;
  /** Optional — Mboka fills missing fields from KYC. */
  sender?: PIIBlock;
};

export type OrderQuoteIn = OrderQuoteOnRampIn | OrderQuoteOffRampIn;

export type AmountWithCurrency = {
  amount: string;
  currency: string;
  network: string | null;
};

export type QuoteAmounts = {
  rate: string | null;
  rate_currency: string | null;
  user_pays: AmountWithCurrency;
  user_receives: AmountWithCurrency;
  fees: Record<string, unknown> | null;
};

export type QuoteInstructions = {
  available_after_accept: boolean;
  note: string;
};

export type OrderQuoteOut = {
  quote_id: string;
  provider: string;
  order_type: OrderTypeName;
  status: "pending";
  expires_at: string | null;
  amounts: QuoteAmounts;
  instructions: QuoteInstructions;
};

export type AcceptedOrder = {
  order_id: string;
  order_type: OrderTypeName;
  amount_fiat: string;
  currency: string;
  amount_crypto: string | null;
  crypto_currency: string | null;
  crypto_network: string | null;
  wallet_address: string | null;
  exchange_rate: string | null;
  psp_transaction_id: string | null;
};

export type PaymentInstructionsOut = {
  /**
   * "momo" — push from mobile money (OnRamp).
   * "bank" — push to OUR receiving bank account (OnRamp bank transfer).
   * "crypto_deposit" — send crypto to a deposit address (OffRamp).
   */
  type: "momo" | "bank" | "crypto_deposit";
  /** momo: {accountNumber, networkName}. */
  source: Record<string, unknown> | null;
  /** bank: structured receiving-bank details, if the provider returns them. */
  bank_info: Record<string, unknown> | null;
  /** bank: reference the user must quote so we can match the transfer. */
  reference: string | null;
  /** bank: receiving account number to push funds to. */
  account_number: string | null;
  /** bank: receiving bank name. */
  bank_name: string | null;
  /** bank: receiving account holder name. */
  account_holder_name: string | null;
  /** crypto_deposit: deposit address the user must send crypto to. */
  wallet_address: string | null;
  /** crypto_deposit / bank: required deposit amount. */
  amount: string | null;
  currency: string | null;
  network: string | null;
  /** crypto_deposit / bank: deposit window expiry. */
  expires_at: string | null;
};

export type OrderAcceptOut = {
  merchant_order_id: number;
  quote_id: string;
  provider: string;
  status: "processing";
  order: AcceptedOrder;
  payment_instructions: PaymentInstructionsOut;
};

type OrderQuoteEnvelope = {
  status: string;
  message: string;
  data: OrderQuoteOut;
};

type OrderAcceptEnvelope = {
  status: string;
  message: string;
  data: OrderAcceptOut;
};

// ---- Read ---------------------------------------------------------------

export type OrderOut = {
  id: number;
  aggregator_order_id: string | null;
  external_order_id: string | null;
  status: string;
  amount_fiat: string;
  currency_code: string;
  checkout_url: string | null;
  wallet_address: string | null;
  client_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string | null;
};

type OrderReadEnvelope = {
  status: string;
  message: string;
  data: OrderOut;
};

export type OrderListOut = {
  items: OrderOut[];
  total: number;
  limit: number;
  offset: number;
};

type OrderListEnvelope = {
  status: string;
  message: string;
  data: OrderListOut;
};

// ---- Calls --------------------------------------------------------------

export async function quoteOrder(payload: QuoteOrderIn): Promise<QuoteOrderOut> {
  const res = await authedFetch(`${API_BASE}/api/v1/orders/quote`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const env = await parseJson<QuoteResponseEnvelope>(res);
  return env.data;
}

export async function createOrder(payload: OrderCreateIn): Promise<OrderCreateOut> {
  const res = await authedFetch(`${API_BASE}/api/v1/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const env = await parseJson<CreateResponseEnvelope>(res);
  return env.data;
}

export async function getOrder(merchantOrderId: number | string): Promise<OrderOut> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/orders/${encodeURIComponent(String(merchantOrderId))}`,
    { method: "GET" },
  );
  const env = await parseJson<OrderReadEnvelope>(res);
  return env.data;
}

/**
 * New two-step flow — create a stateful quote (per ORDER_FLOW.md).
 * Use this instead of legacy `quoteOrder` when you intend to accept and
 * actually create an order. The returned `quote_id` is the path key for
 * `acceptOrderQuote`.
 */
export async function createOrderQuote(
  payload: OrderQuoteIn,
): Promise<OrderQuoteOut> {
  const res = await authedFetch(`${API_BASE}/api/v1/orders/quote`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const env = await parseJson<OrderQuoteEnvelope>(res);
  return env.data;
}

/**
 * New two-step flow — accept a pending quote and create the order.
 * Body is intentionally empty; `quote_id` is the idempotency key.
 */
export async function acceptOrderQuote(
  quoteId: string,
): Promise<OrderAcceptOut> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/orders/${encodeURIComponent(quoteId)}/accept`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
  const env = await parseJson<OrderAcceptEnvelope>(res);
  return env.data;
}

/** Refresh a pending quote (amounts / expires_at) before accept. */
export async function getOrderQuote(quoteId: string): Promise<OrderQuoteOut> {
  const res = await authedFetch(
    `${API_BASE}/api/v1/orders/quote/${encodeURIComponent(quoteId)}`,
  );
  const env = await parseJson<OrderQuoteEnvelope>(res);
  return env.data;
}

export async function listOrders(
  params: {
    status?: string;
    order_type?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<OrderListOut> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.order_type) qs.set("order_type", params.order_type);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  const res = await authedFetch(
    `${API_BASE}/api/v1/orders${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
  const env = await parseJson<OrderListEnvelope>(res);
  return env.data;
}
