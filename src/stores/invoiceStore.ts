"use client";

import { create } from "zustand";
import type { CountryCode } from "@/components/dashboard/dashboardData";
import type { CurrencyCode, InvoicePaymentMethodRail } from "@/components/invoices/invoiceData";

export type PartyDetails = {
  firstName: string;
  lastName: string;
  email: string;
  country: CountryCode | "";
  phone: string;
  address: string;
};

export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceDraft = {
  invoiceTitle: string;
  invoiceId: string;
  issueDate: string; // yyyy-mm-dd
  dueDate: string; // yyyy-mm-dd
  biller: PartyDetails;
  client: PartyDetails;
  receivingWalletId: string;
  preferredCurrency: CurrencyCode | "";
  preferredPaymentMethod: InvoicePaymentMethodRail | "";
  paymentMethodFields: Record<string, string>;
  lineItems: LineItem[];
  vatEnabled: boolean;
  vatPercent: number;
  discountEnabled: boolean;
  discountPercent: number;
  shippingEnabled: boolean;
  shippingAmount: number;
  note: string;
};

function generateInvoiceId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `inv-2024-${rand.toString().padStart(4, "0")}`;
}

function makeLineItem(overrides: Partial<LineItem> = {}): LineItem {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    description: "",
    quantity: 1,
    unitPrice: 0,
    ...overrides,
  };
}

const emptyParty: PartyDetails = {
  firstName: "",
  lastName: "",
  email: "",
  country: "",
  phone: "",
  address: "",
};

function createInitialDraft(): InvoiceDraft {
  return {
    invoiceTitle: "",
    invoiceId: generateInvoiceId(),
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    biller: { ...emptyParty },
    client: { ...emptyParty },
    receivingWalletId: "",
    preferredCurrency: "",
    preferredPaymentMethod: "",
    paymentMethodFields: {},
    lineItems: [makeLineItem()],
    vatEnabled: false,
    vatPercent: 5,
    discountEnabled: false,
    discountPercent: 0,
    shippingEnabled: false,
    shippingAmount: 0,
    note: "",
  };
}

type InvoiceState = {
  draft: InvoiceDraft;
  setDraft: (updater: (draft: InvoiceDraft) => InvoiceDraft) => void;
  resetDraft: () => void;
  updateBiller: (patch: Partial<PartyDetails>) => void;
  updateClient: (patch: Partial<PartyDetails>) => void;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  clearLineItems: () => void;
  updateLineItem: (id: string, patch: Partial<Omit<LineItem, "id">>) => void;
};

export const useInvoiceStore = create<InvoiceState>()((set) => ({
  draft: createInitialDraft(),
  setDraft: (updater) => set((state) => ({ draft: updater(state.draft) })),
  resetDraft: () => set({ draft: createInitialDraft() }),
  updateBiller: (patch) =>
    set((state) => ({ draft: { ...state.draft, biller: { ...state.draft.biller, ...patch } } })),
  updateClient: (patch) =>
    set((state) => ({ draft: { ...state.draft, client: { ...state.draft.client, ...patch } } })),
  addLineItem: () =>
    set((state) => ({ draft: { ...state.draft, lineItems: [...state.draft.lineItems, makeLineItem()] } })),
  removeLineItem: (id) =>
    set((state) => ({
      draft: { ...state.draft, lineItems: state.draft.lineItems.filter((item) => item.id !== id) },
    })),
  clearLineItems: () =>
    set((state) => ({ draft: { ...state.draft, lineItems: [makeLineItem()] } })),
  updateLineItem: (id, patch) =>
    set((state) => ({
      draft: {
        ...state.draft,
        lineItems: state.draft.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      },
    })),
}));

export type InvoiceTotals = {
  subtotal: number;
  vat: number;
  discount: number;
  shipping: number;
  total: number;
};

export function calculateTotals(draft: InvoiceDraft): InvoiceTotals {
  const subtotal = draft.lineItems.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0,
  );
  const vat = draft.vatEnabled ? (subtotal * (Number(draft.vatPercent) || 0)) / 100 : 0;
  const discount = draft.discountEnabled ? (subtotal * (Number(draft.discountPercent) || 0)) / 100 : 0;
  const shipping = draft.shippingEnabled ? Number(draft.shippingAmount) || 0 : 0;
  const total = subtotal + vat + shipping - discount;
  return { subtotal, vat, discount, shipping, total };
}

export function formatInvoiceMoney(amount: number, currency: string | null | undefined): string {
  const safeCurrency = currency && currency.trim() !== "" ? currency : "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^([A-Z]{3})\s?/, "$1 ");
  } catch {
    return `${safeCurrency} ${amount.toFixed(2)}`;
  }
}

export function formatInvoiceMoneyCompact(amount: number, currency: string | null | undefined): string {
  const safeCurrency = currency && currency.trim() !== "" ? currency : "USD";
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${safeCurrency} ${formatted}`;
}
