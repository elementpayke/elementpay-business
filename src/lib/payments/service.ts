"use client";

import type { AmountDetails, RecipientDetails } from "@/stores/sendPaymentStore";
import { type FeeBand, getFeeForAmountKes } from "@/lib/payments/feeStructure";

// --- Mock boundary ------------------------------------------------------
// Swap this file's implementations for real aggregator calls when off-ramp
// endpoints and PIN verification are available. Keep the exported signatures
// stable so call-sites don't change.

export type OrderStatus = "pending" | "validating" | "confirming-fee" | "initializing" | "processing" | "success" | "failed";

export type CreatedOrder = {
  orderId: string;
  status: OrderStatus;
  createdAt: number;
};

export type OrderSnapshot = {
  orderId: string;
  status: OrderStatus;
  progressMs: number;
  transactionId?: string;
  failureReason?: string;
};

export type CreateOrderRequest = {
  recipient: RecipientDetails;
  amount: AmountDetails;
  reference?: string;
};

const MOCK_LATENCY_MS = 650;
const STAGE_TIMINGS: Record<Exclude<OrderStatus, "success" | "failed" | "pending">, number> = {
  validating: 1800,
  "confirming-fee": 1800,
  initializing: 2000,
  processing: 1400,
};

// Mocked in-memory store so polling is deterministic during a session.
const orders = new Map<string, { createdAt: number; transactionId: string }>();

function randomTxId(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  const year = new Date().getFullYear();
  return `txn-${year}-${n}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function verifyTransactionPin(pin: string): Promise<{ ok: true } | { ok: false; message: string }> {
  await wait(MOCK_LATENCY_MS);
  // Mock rule (per product decision): 0000 succeeds, everything else fails.
  if (pin === "0000") return { ok: true };
  return { ok: false, message: "Incorrect PIN. Please try again." };
}

export async function createOffRampOrder(req: CreateOrderRequest): Promise<CreatedOrder> {
  await wait(MOCK_LATENCY_MS);
  const orderId = `ord_${Math.random().toString(36).slice(2, 10)}`;
  orders.set(orderId, { createdAt: Date.now(), transactionId: randomTxId() });
  void req; // mocked — real impl would post payload to aggregator
  return { orderId, status: "validating", createdAt: Date.now() };
}

/**
 * Deterministic staged progression driven off elapsed time. Real impl would
 * hit `/orders/:id` and map backend status onto our local union.
 */
export async function getOrderStatus(orderId: string): Promise<OrderSnapshot> {
  await wait(400);
  const record = orders.get(orderId);
  if (!record) {
    return { orderId, status: "failed", progressMs: 0, failureReason: "Order not found" };
  }

  const elapsed = Date.now() - record.createdAt;
  const tValidating = STAGE_TIMINGS.validating;
  const tFee = tValidating + STAGE_TIMINGS["confirming-fee"];
  const tInit = tFee + STAGE_TIMINGS.initializing;
  const tDone = tInit + STAGE_TIMINGS.processing;

  let status: OrderStatus;
  if (elapsed < tValidating) status = "validating";
  else if (elapsed < tFee) status = "confirming-fee";
  else if (elapsed < tInit) status = "initializing";
  else if (elapsed < tDone) status = "processing";
  else status = "success";

  const snapshot: OrderSnapshot = {
    orderId,
    status,
    progressMs: elapsed,
  };
  if (status === "success") snapshot.transactionId = record.transactionId;
  return snapshot;
}

// --- FX + fees (mocked) -------------------------------------------------

export const KES_PER_USD = 129;

export type FeeInput = {
  sendAmountUsd: number;
  country: string;
  paymentMethod: string;
  feeBands: FeeBand[];
  /** Override the USD↔KES rate; defaults to KES_PER_USD. */
  kesPerUsd?: number;
};

/**
 * Calculate the transaction fee in USD using the backend fee-band structure.
 * Bands are denominated in KES; we convert the send amount to KES, look up
 * the matching band, then convert the band fee back to USD for the UI.
 *
 * For non-KES corridors there's no band data yet, so we keep the legacy
 * flat USD 5 fallback.
 */
export function calculateFee({
  sendAmountUsd,
  country,
  feeBands,
  kesPerUsd = KES_PER_USD,
}: FeeInput): number {
  if (country !== "Kenya") return 5;
  if (feeBands.length === 0) return 0;
  const amountKes = sendAmountUsd * kesPerUsd;
  const feeKes = getFeeForAmountKes(amountKes, feeBands);
  return Math.round((feeKes / kesPerUsd) * 100) / 100;
}

export function usdToKes(usd: number): number {
  return Math.round(usd * KES_PER_USD * 100) / 100;
}

export function kesToUsd(kes: number): number {
  return Math.round((kes / KES_PER_USD) * 100) / 100;
}
