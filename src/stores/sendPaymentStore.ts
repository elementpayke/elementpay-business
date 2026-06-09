"use client";

import { create } from "zustand";
import type { OrderCreateOut, QuoteOrderOut } from "@/lib/orders";
import type { NormalizedQuoteError } from "@/lib/orderErrors";

export type SendPaymentPhase =
  | "recipient-details"
  | "payment-amount"
  | "payment-review"
  | "success"
  | "error";

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
  accountNumber: string;
  name?: string;
  // BANK-only: backend requires bank_code + phone_number alongside account_number
  bankCode?: string;
  bankPhoneNumber?: string;
};

export type AmountDetails = {
  sourceWalletAddress: string;
  tokenAddress: string;
  tokenSymbol: string;
  network: string;
  refundAddress: string;
  fiatAmount: number;
  receiveCurrency: string;
  receiveCountry: string;
};

export type PaymentResult = {
  order: OrderCreateOut;
  processingMs: number;
  completedAt: number;
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
  quote: QuoteOrderOut | null;
  quoteLoading: boolean;
  quoteError: NormalizedQuoteError | null;
  result: PaymentResult | null;
  error: PaymentError | null;
};

type SendPaymentActions = {
  setPhase: (phase: SendPaymentPhase) => void;
  setRecipient: (recipient: RecipientDetails) => void;
  setAmount: (amount: AmountDetails) => void;
  setReference: (reference: string) => void;
  setQuote: (quote: QuoteOrderOut | null) => void;
  setQuoteLoading: (loading: boolean) => void;
  setQuoteError: (err: NormalizedQuoteError | null) => void;
  setResult: (result: PaymentResult) => void;
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
