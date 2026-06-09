import type { CountryCode } from "@/components/dashboard/dashboardData";
import {
  findCountry,
  paymentMethodsByCountry,
  type CurrencyCode,
  type InvoicePaymentMethodRail,
} from "@/components/invoices/invoiceData";
import {
  calculateTotals,
  type InvoiceDraft,
  type LineItem,
  type PartyDetails,
} from "@/stores/invoiceStore";

export type InvoiceStatus = "draft" | "issued";

export type InvoicePayloadParty = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: {
    raw: string;
    dialCode: string | null;
    e164: string | null;
  };
  country: {
    code: CountryCode | null;
    name: string | null;
  };
  address: string;
};

export type InvoicePayloadLineItem = {
  id: string;
  position: number;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type InvoicePayloadPaymentMethod = {
  rail: InvoicePaymentMethodRail | null;
  label: string | null;
  fields: Record<string, string>;
};

export type InvoicePayloadTotals = {
  subtotal: number;
  vat: number;
  discount: number;
  shipping: number;
  total: number;
};

export type InvoiceCreatePayload = {
  status: InvoiceStatus;
  invoice: {
    id: string;
    title: string;
    issueDate: string;
    dueDate: string;
    currency: CurrencyCode | null;
    receivingWalletId: string | null;
    note: string;
  };
  biller: InvoicePayloadParty;
  client: InvoicePayloadParty;
  paymentMethod: InvoicePayloadPaymentMethod;
  lineItems: InvoicePayloadLineItem[];
  charges: {
    vat: { enabled: boolean; percent: number };
    discount: { enabled: boolean; percent: number };
    shipping: { enabled: boolean; amount: number };
  };
  totals: InvoicePayloadTotals;
  meta: {
    source: "elementpay-dashboard";
    schemaVersion: 1;
    createdAt: string;
  };
};

export type InvoiceValidationError = {
  field: string;
  message: string;
};

function serializeParty(party: PartyDetails): InvoicePayloadParty {
  const country = findCountry(party.country);
  const phoneRaw = party.phone.trim();
  const dialCode = country?.dialCode ?? null;
  const digits = phoneRaw.replace(/\D/g, "");
  const e164 = dialCode && digits ? `${dialCode}${digits}` : null;
  const fullName = [party.firstName, party.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");

  return {
    firstName: party.firstName.trim(),
    lastName: party.lastName.trim(),
    fullName,
    email: party.email.trim(),
    phone: {
      raw: phoneRaw,
      dialCode,
      e164,
    },
    country: {
      code: country?.code ?? null,
      name: country?.name ?? null,
    },
    address: party.address.trim(),
  };
}

function serializeLineItems(items: LineItem[]): InvoicePayloadLineItem[] {
  return items.map((item, index) => {
    const qty = Number(item.quantity) || 0;
    const unit = Number(item.unitPrice) || 0;
    return {
      id: item.id,
      position: index + 1,
      description: item.description.trim(),
      quantity: qty,
      unitPrice: unit,
      amount: qty * unit,
    };
  });
}

function serializePaymentMethod(draft: InvoiceDraft): InvoicePayloadPaymentMethod {
  const clientCountry = draft.client.country;
  const list = clientCountry ? paymentMethodsByCountry[clientCountry] : [];
  const match = list.find((m) => m.id === draft.preferredPaymentMethod);

  const fields: Record<string, string> = {};
  if (match) {
    for (const field of match.fields) {
      const value = draft.paymentMethodFields[field.key];
      if (value && value.trim()) {
        fields[field.key] = value.trim();
      }
    }
  }

  return {
    rail: (draft.preferredPaymentMethod || null) as InvoicePaymentMethodRail | null,
    label: match?.label ?? null,
    fields,
  };
}

export function buildInvoicePayload(
  draft: InvoiceDraft,
  status: InvoiceStatus,
): InvoiceCreatePayload {
  const totals = calculateTotals(draft);

  return {
    status,
    invoice: {
      id: draft.invoiceId,
      title: draft.invoiceTitle.trim(),
      issueDate: draft.issueDate,
      dueDate: draft.dueDate,
      currency: (draft.preferredCurrency || null) as CurrencyCode | null,
      receivingWalletId: draft.receivingWalletId || null,
      note: draft.note.trim(),
    },
    biller: serializeParty(draft.biller),
    client: serializeParty(draft.client),
    paymentMethod: serializePaymentMethod(draft),
    lineItems: serializeLineItems(draft.lineItems),
    charges: {
      vat: { enabled: draft.vatEnabled, percent: Number(draft.vatPercent) || 0 },
      discount: {
        enabled: draft.discountEnabled,
        percent: Number(draft.discountPercent) || 0,
      },
      shipping: {
        enabled: draft.shippingEnabled,
        amount: Number(draft.shippingAmount) || 0,
      },
    },
    totals,
    meta: {
      source: "elementpay-dashboard",
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
    },
  };
}

export function validateInvoiceDraft(
  draft: InvoiceDraft,
  status: InvoiceStatus,
): InvoiceValidationError[] {
  const errors: InvoiceValidationError[] = [];

  if (status === "draft") {
    if (!draft.invoiceId) {
      errors.push({ field: "invoice.id", message: "Invoice ID is required" });
    }
    return errors;
  }

  if (!draft.invoiceTitle.trim()) {
    errors.push({ field: "invoice.title", message: "Invoice title is required" });
  }
  if (!draft.issueDate) {
    errors.push({ field: "invoice.issueDate", message: "Issue date is required" });
  }
  if (!draft.dueDate) {
    errors.push({ field: "invoice.dueDate", message: "Due date is required" });
  }
  if (draft.issueDate && draft.dueDate && draft.dueDate < draft.issueDate) {
    errors.push({
      field: "invoice.dueDate",
      message: "Due date must be on or after the issue date",
    });
  }
  if (!draft.preferredCurrency) {
    errors.push({
      field: "invoice.currency",
      message: "Preferred payment currency is required",
    });
  }
  if (!draft.receivingWalletId) {
    errors.push({
      field: "invoice.receivingWalletId",
      message: "Receiving wallet is required",
    });
  }

  if (!draft.biller.firstName.trim() || !draft.biller.lastName.trim()) {
    errors.push({ field: "biller.name", message: "Biller name is required" });
  }
  if (!draft.biller.email.trim()) {
    errors.push({ field: "biller.email", message: "Biller email is required" });
  }
  if (!draft.biller.country) {
    errors.push({ field: "biller.country", message: "Biller country is required" });
  }

  if (!draft.client.firstName.trim() || !draft.client.lastName.trim()) {
    errors.push({ field: "client.name", message: "Client name is required" });
  }
  if (!draft.client.email.trim()) {
    errors.push({ field: "client.email", message: "Client email is required" });
  }
  if (!draft.client.country) {
    errors.push({ field: "client.country", message: "Client country is required" });
  }

  if (!draft.preferredPaymentMethod) {
    errors.push({
      field: "paymentMethod.rail",
      message: "Preferred payment method is required",
    });
  } else {
    const list = draft.client.country ? paymentMethodsByCountry[draft.client.country] : [];
    const method = list.find((m) => m.id === draft.preferredPaymentMethod);
    if (method) {
      for (const field of method.fields) {
        const value = draft.paymentMethodFields[field.key];
        if (!value || !value.trim()) {
          errors.push({
            field: `paymentMethod.fields.${field.key}`,
            message: `${field.label} is required`,
          });
        }
      }
    }
  }

  const validItems = draft.lineItems.filter(
    (i) => i.description.trim() && (Number(i.quantity) || 0) > 0,
  );
  if (validItems.length === 0) {
    errors.push({
      field: "lineItems",
      message: "Add at least one line item with a description and quantity",
    });
  }

  return errors;
}
