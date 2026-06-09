"use client";

import { create } from "zustand";
import type { OrderAcceptOut, OrderQuoteOut } from "@/lib/orders";
import type { NormalizedQuoteError } from "@/lib/orderErrors";

export type DepositPhase =
  | "deposit-details"
  | "confirm-deposit"
  | "success"
  | "error";

export type DepositPaymentMethod = "momo" | "bank" | null;

/** The concrete pay-in provider the user chose (Airtel, M-PESA, a receiving
 *  bank, …). Captured in the UI; not yet sent to the quote API. */
export type DepositProvider = {
  id: string;
  code: string;
  name: string;
  groupKey: "mobile_money" | "bank";
} | null;

// Currency / country are now driven by the supported-catalog API, so these
// are plain ISO strings rather than a fixed union.
export type DepositCurrency = string | null;

export type DepositCountry = string | null;

type DepositState = {
  phase: DepositPhase;
  selectedWalletAddress: string | null;
  selectedWalletLabel: string | null;
  selectedTokenAddress: string | null;
  selectedTokenNetwork: string | null;
  selectedCurrency: DepositCurrency;
  selectedCountry: DepositCountry;
  amountFiat: number;
  paymentMethod: DepositPaymentMethod;
  selectedProvider: DepositProvider;
  phoneNumber: string;
  accountName: string;
  accountNumber: string;
  bankCode: string;
  quote: OrderQuoteOut | null;
  quoteLoading: boolean;
  quoteError: NormalizedQuoteError | null;
  orderResult: OrderAcceptOut | null;
  errorMessage: string | null;
};

type DepositActions = {
  setWallet: (
    address: string,
    label: string,
    tokenAddress: string,
    network: string,
  ) => void;
  setCurrency: (currency: DepositCurrency, country: DepositCountry) => void;
  setAmount: (amount: number) => void;
  setPaymentMethod: (method: DepositPaymentMethod) => void;
  setProvider: (provider: DepositProvider) => void;
  setPhoneNumber: (phone: string) => void;
  setAccountName: (name: string) => void;
  setAccountNumber: (num: string) => void;
  setBankCode: (code: string) => void;
  setQuote: (quote: OrderQuoteOut | null) => void;
  setQuoteLoading: (loading: boolean) => void;
  setQuoteError: (err: NormalizedQuoteError | null) => void;
  setPhase: (phase: DepositPhase) => void;
  setOrderResult: (result: OrderAcceptOut) => void;
  setErrorMessage: (msg: string | null) => void;
  reset: () => void;
};

export type DepositStore = DepositState & DepositActions;

const initialState: DepositState = {
  phase: "deposit-details",
  selectedWalletAddress: null,
  selectedWalletLabel: null,
  selectedTokenAddress: null,
  selectedTokenNetwork: null,
  selectedCurrency: null,
  selectedCountry: null,
  amountFiat: 0,
  paymentMethod: null,
  selectedProvider: null,
  phoneNumber: "",
  accountName: "",
  accountNumber: "",
  bankCode: "",
  quote: null,
  quoteLoading: false,
  quoteError: null,
  orderResult: null,
  errorMessage: null,
};

export const useDepositStore = create<DepositStore>()((set) => ({
  ...initialState,

  setWallet: (address, label, tokenAddress, network) =>
    set({
      selectedWalletAddress: address,
      selectedWalletLabel: label,
      selectedTokenAddress: tokenAddress,
      selectedTokenNetwork: network,
    }),
  setCurrency: (currency, country) =>
    set({
      selectedCurrency: currency,
      selectedCountry: country,
      paymentMethod: null,
      selectedProvider: null,
      phoneNumber: "",
      accountName: "",
      accountNumber: "",
      bankCode: "",
      quote: null,
      quoteError: null,
    }),
  setAmount: (amount) => set({ amountFiat: amount, quote: null }),
  setPaymentMethod: (paymentMethod) =>
    // Switching method invalidates the chosen provider (each method has its
    // own list) and the quote.
    set({ paymentMethod, selectedProvider: null, quote: null }),
  setProvider: (selectedProvider) => set({ selectedProvider, quote: null }),
  setPhoneNumber: (phoneNumber) => set({ phoneNumber }),
  setAccountName: (accountName) => set({ accountName }),
  setAccountNumber: (accountNumber) => set({ accountNumber }),
  setBankCode: (bankCode) => set({ bankCode }),
  setQuote: (quote) => set({ quote }),
  setQuoteLoading: (quoteLoading) => set({ quoteLoading }),
  setQuoteError: (quoteError) => set({ quoteError }),
  setPhase: (phase) => set({ phase }),
  setOrderResult: (orderResult) => set({ orderResult }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  reset: () => set({ ...initialState }),
}));
