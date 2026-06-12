"use client";

import { create } from "zustand";
import type { OrderAcceptOut, OrderQuoteOut } from "@/lib/orders";
import type { NormalizedQuoteError } from "@/lib/orderErrors";

export type SendPaymentPhase =
  | "recipient-details"
  | "payment-amount"
  | "payment-review"
  | "success"
  | "error";

/**
 * Step 1 — WHO and HOW. Identifies the recipient and the payout rail only.
 * The actual destination account (number/name/phone) is collected on step 2,
 * after the amount, per the send-payment flow spec.
 */
export type RecipientDetails = {
  email: string;
  /** Display country name from the catalog, e.g. "Kenya". */
  country: string;
  /** ISO 3166-1 alpha-2, e.g. "KE". */
  countryCode: string;
  /** ISO 4217 fiat the recipient receives, e.g. "KES". */
  receiveCurrency: string;
  /** Human label of the chosen method, e.g. "Mobile Money". */
  paymentMethod: string;
  /** Exact catalog option chosen (CatalogMethodOption.optionKey) — restores the
   *  picker on back-nav; distinguishes the bank method from individual rails. */
  methodOptionKey: string;
  accountType: "momo" | "bank";
  /** BANK-only: which bank we offramp to (CatalogProvider.code). Chosen on step 1
   *  from the list of banks available for the corridor. */
  bankCode?: string;
  /** BANK-only: human name of the chosen bank, for display on review. */
  bankName?: string;
  /** BANK-only: aggregator institution id (CatalogProvider.id). Sent as
   *  `destination.networkId` on the OffRamp quote so the aggregator knows
   *  which institution to route the payout to. */
  bankNetworkId?: string;
};

/**
 * Step 2 — HOW MUCH and WHERE. Carries the funding wallet/token, the amount
 * pair (recipient fiat + derived USDC the sender spends), and the destination
 * account details that depend on the rail chosen in step 1.
 */
export type AmountDetails = {
  sourceWalletAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  network: string;
  refundAddress: string;
  /** Amount the recipient receives, in their fiat currency. */
  fiatAmount: number;
  /** USDC the sender spends. The OffRamp quote (step 3) is denominated in
   *  crypto, and the live quote on the review step is the source of truth for
   *  this value — step 2 leaves it "" and ReviewStep derives it from the
   *  quote response. Kept in the shape for compatibility. */
  cryptoAmount: string;
  receiveCurrency: string;
  receiveCountry: string;
  /** Destination account holder name. */
  accountName: string;
  /** E.164 phone (momo) or bank account number (bank). */
  accountNumber: string;
};

export type PaymentError = {
  code: string;
  message: string;
  retryable: boolean;
};

type SendPaymentState = {
  phase: SendPaymentPhase;
  recipient: RecipientDetails | null;
  amount: AmountDetails | null;
  reference: string;
  /** Stateful quote from POST /orders/quote (OffRamp). Carries quote_id. */
  quote: OrderQuoteOut | null;
  quoteLoading: boolean;
  quoteError: NormalizedQuoteError | null;
  /** Accept-quote response — the real created order + payment instructions. */
  result: OrderAcceptOut | null;
  error: PaymentError | null;
};

type SendPaymentActions = {
  setPhase: (phase: SendPaymentPhase) => void;
  setRecipient: (recipient: RecipientDetails) => void;
  setAmount: (amount: AmountDetails) => void;
  setReference: (reference: string) => void;
  setQuote: (quote: OrderQuoteOut | null) => void;
  setQuoteLoading: (loading: boolean) => void;
  setQuoteError: (err: NormalizedQuoteError | null) => void;
  setResult: (result: OrderAcceptOut) => void;
  setError: (error: PaymentError) => void;
  reset: () => void;
  resetForNewPayment: () => void;
};

export type SendPaymentStore = SendPaymentState & SendPaymentActions;

const initialState: SendPaymentState = {
  phase: "recipient-details",
  recipient: null,
  amount: null,
  reference: "",
  quote: null,
  quoteLoading: false,
  quoteError: null,
  result: null,
  error: null,
};

export const useSendPaymentStore = create<SendPaymentStore>()((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setRecipient: (recipient) => set({ recipient }),
  // Editing the amount/destination invalidates any quote we'd already fetched.
  setAmount: (amount) => set({ amount, quote: null }),
  setReference: (reference) => set({ reference }),
  setQuote: (quote) => set({ quote }),
  setQuoteLoading: (quoteLoading) => set({ quoteLoading }),
  setQuoteError: (quoteError) => set({ quoteError }),
  setResult: (result) => set({ result, phase: "success" }),
  setError: (error) => set({ error, phase: "error" }),

  reset: () => set({ ...initialState }),
  resetForNewPayment: () => set({ ...initialState }),
}));

export function phaseToStep(phase: SendPaymentPhase): 1 | 2 | 3 {
  if (phase === "recipient-details") return 1;
  if (phase === "payment-amount") return 2;
  return 3;
}
