"use client";

import { create } from "zustand";
import type { Country, SavedRecipient } from "@/components/payments/paymentData";

export type SendPaymentPhase =
  | "recipient-details"
  | "payment-amount"
  | "payment-review"
  | "pin-confirmation"
  | "processing"
  | "success"
  | "error";

export type ProcessingStage = "validating" | "confirming-fee" | "initializing" | "done";

export type RecipientDetails = {
  email: string;
  country: Country;
  paymentMethod: string;
  name?: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  paybillNumber?: string;
  accountReference?: string;
};

export type AmountDetails = {
  sourceWalletAddress: string;
  sendAmount: number;
  sendCurrency: string;
  receiveAmount: number;
  receiveCurrency: string;
  fee: number;
  fxRate: number;
};

export type PaymentResult = {
  transactionId: string;
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
  processingStage: ProcessingStage;
  recipient: RecipientDetails | null;
  amount: AmountDetails | null;
  reference: string;
  pinError: string | null;
  pinAttempts: number;
  pendingOrderId: string | null;
  result: PaymentResult | null;
  error: PaymentError | null;
};

type SendPaymentActions = {
  setPhase: (phase: SendPaymentPhase) => void;
  setRecipient: (recipient: RecipientDetails) => void;
  setAmount: (amount: AmountDetails) => void;
  setReference: (reference: string) => void;
  setPinError: (message: string | null) => void;
  incrementPinAttempts: () => void;
  setPendingOrderId: (id: string | null) => void;
  setProcessingStage: (stage: ProcessingStage) => void;
  setResult: (result: PaymentResult) => void;
  setError: (error: PaymentError) => void;
  reset: () => void;
  resetForNewPayment: () => void;
};

export type SendPaymentStore = SendPaymentState & SendPaymentActions;

const initialState: SendPaymentState = {
  phase: "recipient-details",
  processingStage: "validating",
  recipient: null,
  amount: null,
  reference: "",
  pinError: null,
  pinAttempts: 0,
  pendingOrderId: null,
  result: null,
  error: null,
};

export const useSendPaymentStore = create<SendPaymentStore>()((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setRecipient: (recipient) => set({ recipient }),
  setAmount: (amount) => set({ amount }),
  setReference: (reference) => set({ reference }),
  setPinError: (pinError) => set({ pinError }),
  incrementPinAttempts: () => set((s) => ({ pinAttempts: s.pinAttempts + 1 })),
  setPendingOrderId: (pendingOrderId) => set({ pendingOrderId }),
  setProcessingStage: (processingStage) => set({ processingStage }),
  setResult: (result) => set({ result, phase: "success" }),
  setError: (error) => set({ error, phase: "error" }),

  reset: () => set({ ...initialState }),
  resetForNewPayment: () =>
    set({
      ...initialState,
      // keep recipient so "Send another payment" doesn't wipe the selected recipient
    }),
}));

export function phaseToStep(phase: SendPaymentPhase): 1 | 2 | 3 {
  if (phase === "recipient-details") return 1;
  if (phase === "payment-amount") return 2;
  return 3;
}

export function SavedRecipientToDetails(r: SavedRecipient): RecipientDetails {
  return {
    email: r.email,
    country: r.country,
    paymentMethod: r.paymentMethod,
    name: r.name,
    phoneNumber: r.phoneNumber,
  };
}
