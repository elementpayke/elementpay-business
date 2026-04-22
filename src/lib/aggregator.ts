const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    const detail =
      body?.message ||
      body?.detail ||
      body?.error ||
      `Request failed (${res.status})`;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg ?? "").join(", ")
          : "Request failed";
    throw new AggregatorError(message, res.status, body);
  }
  return body as T;
}

export class AggregatorError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "AggregatorError";
    this.status = status;
    this.body = body;
  }
}

export interface OrderQuoteResponse {
  status: string;
  message: string;
  data: {
    required_token_amount: number;
    required_token_amount_raw: number;
    fee_amount: number;
    effective_rate: number;
    fiat_amount: number;
    currency: string;
    token: string;
    order_type: string;
  };
}

export interface CreateOrderResponse {
  status: string;
  message: string;
  data: {
    tx_hash: string;
    status: string;
    rate_used: number;
    amount_sent: number;
    fiat_paid: number;
  };
}

// order_type: 0 = on-ramp (fiat → crypto), 1 = off-ramp.
export async function fetchOrderQuote(params: {
  amountFiat: number;
  tokenAddress: string;
  walletAddress: string;
  orderType?: 0 | 1;
  currency?: string;
}): Promise<OrderQuoteResponse> {
  const res = await fetch(`${API_BASE}/quote/order`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      amount_fiat: params.amountFiat,
      token: params.tokenAddress,
      order_type: params.orderType ?? 0,
      currency: params.currency ?? "KES",
      wallet_address: params.walletAddress,
    }),
  });
  return parseJson<OrderQuoteResponse>(res);
}

export async function createOnRampOrder(params: {
  userAddress: string;
  tokenAddress: string;
  amountFiat: number;
  phoneNumber: string;
  reason?: string;
  currency?: string;
}): Promise<CreateOrderResponse> {
  const payload: Record<string, unknown> = {
    user_address: params.userAddress,
    token: params.tokenAddress,
    order_type: 0,
    fiat_payload: {
      amount_fiat: params.amountFiat,
      cashout_type: "PHONE",
      phone_number: params.phoneNumber,
      currency: params.currency ?? "KES",
    },
  };
  if (params.reason) payload.reason = params.reason;

  const res = await fetch(`${API_BASE}/orders/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<CreateOrderResponse>(res);
}

// TODO: confirm endpoint and payload with backend team
export async function createPaybillOrder(params: {
  userAddress: string;
  tokenAddress: string;
  amountFiat: number;
  currency?: string;
}): Promise<CreateOrderResponse> {
  const payload: Record<string, unknown> = {
    user_address: params.userAddress,
    token: params.tokenAddress,
    order_type: 0,
    fiat_payload: {
      amount_fiat: params.amountFiat,
      cashout_type: "PAYBILL",
      currency: params.currency ?? "KES",
    },
  };

  const res = await fetch(`${API_BASE}/orders/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<CreateOrderResponse>(res);
}

// TODO: PCI – must use payment processor SDK tokenization before production
// TODO: confirm endpoint and payload with backend team
export async function createBankTransferOrder(params: {
  userAddress: string;
  tokenAddress: string;
  amountFiat: number;
  currency?: string;
  cardDetails: {
    cardholder: string;
    number: string;
    expiry: string;
    cvv: string;
  };
}): Promise<CreateOrderResponse> {
  const payload: Record<string, unknown> = {
    user_address: params.userAddress,
    token: params.tokenAddress,
    order_type: 0,
    fiat_payload: {
      amount_fiat: params.amountFiat,
      cashout_type: "CARD",
      currency: params.currency ?? "USD",
      card: {
        cardholder: params.cardDetails.cardholder,
        number: params.cardDetails.number,
        expiry: params.cardDetails.expiry,
        cvv: params.cardDetails.cvv,
      },
    },
  };

  const res = await fetch(`${API_BASE}/orders/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  return parseJson<CreateOrderResponse>(res);
}
