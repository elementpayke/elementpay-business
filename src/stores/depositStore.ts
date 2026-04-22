"use client";

import { create } from "zustand";

export type DepositPhase =
  | "deposit-details"
  | "confirm-deposit"
  | "processing"
  | "success"
  | "error";

export type DepositPaymentMethod =
  | "mpesa-mobile"
  | "mpesa-paybill"
  | "bank-transfer"
  | null;

export type DepositCurrency = "KES" | "NGN" | "GHS" | "USD" | null;

export type DepositCardDetails = {
  cardholder: string;
  number: string;
  expiry: string;
  cvv: string;
};

export type DepositOrderResult = {
  txHash: string | null;
  orderId: string | null;
  status: string | null;
  processingTimeMs: number | null;
};

type DepositState = {
  phase: DepositPhase;
  selectedWalletAddress: string | null;
  selectedWalletLabel: string | null;
  selectedTokenAddress: string | null;
  selectedCurrency: DepositCurrency;
  amountFiat: number;
  paymentMethod: DepositPaymentMethod;
  phoneNumber: string;
  savePhone: boolean;
  cardDetails: DepositCardDetails;
  orderResult: DepositOrderResult | null;
  errorMessage: string | null;
};

type DepositActions = {
  setWallet: (address: string, label: string, tokenAddress: string) => void;
  setCurrency: (currency: DepositCurrency) => void;
  setAmount: (amount: number) => void;
  setPaymentMethod: (method: DepositPaymentMethod) => void;
  setPhoneNumber: (phone: string) => void;
  setSavePhone: (val: boolean) => void;
  updateCardDetails: (partial: Partial<DepositCardDetails>) => void;
  setPhase: (phase: DepositPhase) => void;
  setOrderResult: (result: DepositOrderResult) => void;
  setErrorMessage: (msg: string | null) => void;
  reset: () => void;
};

export type DepositStore = DepositState & DepositActions;

const initialCard: DepositCardDetails = {
  cardholder: "",
  number: "",
  expiry: "",
  cvv: "",
};

const initialState: DepositState = {
  phase: "deposit-details",
  selectedWalletAddress: null,
  selectedWalletLabel: null,
  selectedTokenAddress: null,
  selectedCurrency: null,
  amountFiat: 0,
  paymentMethod: null,
  phoneNumber: "",
  savePhone: false,
  cardDetails: initialCard,
  orderResult: null,
  errorMessage: null,
};

export const useDepositStore = create<DepositStore>()((set) => ({
  ...initialState,

  setWallet: (address, label, tokenAddress) =>
    set({
      selectedWalletAddress: address,
      selectedWalletLabel: label,
      selectedTokenAddress: tokenAddress,
    }),
  setCurrency: (currency) =>
    set({
      selectedCurrency: currency,
      paymentMethod: null,
      phoneNumber: "",
      cardDetails: initialCard,
    }),
  setAmount: (amount) => set({ amountFiat: amount }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
  setSavePhone: (savePhone) => set({ savePhone }),
  updateCardDetails: (partial) =>
    set((s) => ({ cardDetails: { ...s.cardDetails, ...partial } })),
  setPhase: (phase) => set({ phase }),
  setOrderResult: (orderResult) => set({ orderResult }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  reset: () => set({ ...initialState }),
}));
