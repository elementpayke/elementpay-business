export type FeeBand = {
  min_amount: number;
  max_amount: number | null;
  fee_amount: number;
  description: string;
};

export type FeeStructureResponse = {
  status: string;
  message: string;
  data: {
    currency: string;
    base_rate: number;
    order_type: "OffRamp" | "OnRamp";
    fee_type: string;
    fee_currency: string;
    fee_bands: FeeBand[];
  };
};

export type FetchFeeStructureParams = {
  token: string;
  action: "OffRamp" | "OnRamp";
};

// Mirrors the dapp-staging defaults so we degrade gracefully if the proxy fails.
export const DEFAULT_FEE_BANDS: FeeBand[] = [
  { min_amount: 0, max_amount: 100, fee_amount: 0, description: "0-100 KES: 0 KES fee" },
  { min_amount: 101, max_amount: 500, fee_amount: 5, description: "101-500 KES: 5 KES fee" },
  { min_amount: 501, max_amount: 1000, fee_amount: 8, description: "501-1000 KES: 8 KES fee" },
  { min_amount: 1001, max_amount: 2500, fee_amount: 12, description: "1001-2500 KES: 12 KES fee" },
  { min_amount: 2501, max_amount: 5000, fee_amount: 18, description: "2501-5000 KES: 18 KES fee" },
  { min_amount: 5001, max_amount: 10000, fee_amount: 25, description: "5001-10000 KES: 25 KES fee" },
  { min_amount: 10001, max_amount: 25000, fee_amount: 40, description: "10001-25000 KES: 40 KES fee" },
  { min_amount: 25001, max_amount: 50000, fee_amount: 55, description: "25001-50000 KES: 55 KES fee" },
  { min_amount: 50001, max_amount: 100000, fee_amount: 80, description: "50001-100000 KES: 80 KES fee" },
  { min_amount: 100001, max_amount: null, fee_amount: 100, description: "100001-∞ KES: 100 KES fee" },
];

export function getFeeForAmountKes(amountKes: number, feeBands: FeeBand[]): number {
  if (!Number.isFinite(amountKes) || amountKes <= 0 || feeBands.length === 0) {
    return 0;
  }
  const sorted = [...feeBands].sort((a, b) => a.min_amount - b.min_amount);
  for (const band of sorted) {
    const max = band.max_amount ?? Infinity;
    if (amountKes >= band.min_amount && amountKes <= max) {
      return band.fee_amount;
    }
  }
  return sorted[sorted.length - 1]?.fee_amount ?? 0;
}

async function fetchFeeStructure(
  params: FetchFeeStructureParams,
): Promise<FeeStructureResponse> {
  const url = `/api/fee-structure?token=${encodeURIComponent(
    params.token,
  )}&action=${encodeURIComponent(params.action)}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Fee structure request failed: ${res.status}`);
  }

  const data = await res.json();
  if (data?.status !== "success" || !Array.isArray(data?.data?.fee_bands)) {
    throw new Error(data?.message || "Invalid fee structure response");
  }

  const feeBands: FeeBand[] = data.data.fee_bands.map((band: Partial<FeeBand>) => ({
    min_amount: Number(band.min_amount) || 0,
    max_amount: band.max_amount != null ? Number(band.max_amount) : null,
    fee_amount: Number(band.fee_amount) || 0,
    description:
      band.description ||
      `${band.min_amount}-${band.max_amount ?? "∞"} ${data.data.fee_currency || ""}`.trim(),
  }));

  return {
    status: "success",
    message: data.message || "ok",
    data: {
      currency: data.data.currency || params.token,
      base_rate: Number(data.data.base_rate) || 0,
      order_type: data.data.order_type || params.action,
      fee_type: data.data.fee_type || "band_based",
      fee_currency: data.data.fee_currency || "KES",
      fee_bands: feeBands,
    },
  };
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { data: FeeStructureResponse; timestamp: number }>();
const inflight = new Map<string, Promise<FeeStructureResponse>>();

export async function fetchFeeStructureCached(
  params: FetchFeeStructureParams,
): Promise<FeeStructureResponse> {
  const key = `${params.token}-${params.action}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const existing = inflight.get(key);
  if (existing) return existing;

  const request = fetchFeeStructure(params)
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now() });
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, request);
  return request;
}
