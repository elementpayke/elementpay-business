import { describe, expect, it } from "vitest";
import {
  DEFAULT_INVOICE_PREVIEW_TAB,
  buildInvoicePreviewModel,
  getInvoicePreviewPanelId,
  getInvoicePreviewTabId,
  invoicePreviewTabs,
  resolveInvoicePreviewKeyboardTab,
  resolveInvoicePreviewTab,
} from "@/components/invoices/InvoicePreviewTabs";
import type { InvoiceDraft } from "@/stores/invoiceStore";

function makeDraft(overrides: Partial<InvoiceDraft> = {}): InvoiceDraft {
  return {
    invoiceTitle: "",
    invoiceId: "INV-2026-0042",
    issueDate: "2026-06-20",
    dueDate: "2026-07-15",
    biller: {
      firstName: "Amina",
      lastName: "Otieno",
      email: "amina@example.com",
      country: "KE",
      phone: "",
      address: "",
    },
    client: {
      firstName: "Kwame",
      lastName: "Mensah",
      email: "kwame@example.com",
      country: "KE",
      phone: "",
      address: "",
    },
    receivingWalletId: "wallet-b",
    preferredCurrency: "KES",
    preferredPaymentMethod: "mpesa_paybill",
    paymentMethodFields: {},
    lineItems: [
      {
        id: "line-1",
        description: "Design sprint",
        quantity: 2,
        unitPrice: 1500,
      },
    ],
    vatEnabled: false,
    vatPercent: 5,
    discountEnabled: false,
    discountPercent: 0,
    shippingEnabled: false,
    shippingAmount: 0,
    supportingDocuments: [
      {
        id: "doc-1",
        name: "purchase-order.pdf",
        sizeBytes: 2048,
        mimeType: "application/pdf",
      },
      {
        id: "doc-2",
        name: "statement.pdf",
        sizeBytes: 4096,
        mimeType: "application/pdf",
      },
    ],
    note: "Please reference PO-7788 when paying.",
    ...overrides,
  };
}

describe("invoicePreviewTabs", () => {
  it("uses PDF Preview as the default tab", () => {
    expect(DEFAULT_INVOICE_PREVIEW_TAB).toBe("pdf");
    expect(invoicePreviewTabs[0]).toMatchObject({
      id: "pdf",
      label: "PDF Preview",
    });
  });

  it("exposes the PDF, Payer, and Email preview labels", () => {
    expect(invoicePreviewTabs.map((tab) => tab.label)).toEqual([
      "PDF Preview",
      "Payer Preview",
      "Email Preview",
    ]);
  });

  it("exposes stable accessibility ids for each tab and panel", () => {
    expect(
      invoicePreviewTabs.map((tab) => ({
        tabId: getInvoicePreviewTabId(tab.id),
        panelId: getInvoicePreviewPanelId(tab.id),
      })),
    ).toEqual([
      {
        tabId: "invoice-preview-tab-pdf",
        panelId: "invoice-preview-panel-pdf",
      },
      {
        tabId: "invoice-preview-tab-payer",
        panelId: "invoice-preview-panel-payer",
      },
      {
        tabId: "invoice-preview-tab-email",
        panelId: "invoice-preview-panel-email",
      },
    ]);
  });
});

describe("buildInvoicePreviewModel", () => {
  it("maps the default and selected PDF tab to the compact PDF preview panel", () => {
    expect(buildInvoicePreviewModel(makeDraft()).panel).toEqual({
      kind: "pdf",
      compact: true,
    });
    expect(buildInvoicePreviewModel(makeDraft(), "pdf").panel).toEqual({
      kind: "pdf",
      compact: true,
    });
  });

  it("derives payer preview content from the supplied draft", () => {
    const model = buildInvoicePreviewModel(makeDraft(), "payer");

    expect(model.panel).toMatchObject({
      kind: "payer",
      eyebrow: "Payer checkout",
      title: "Invoice from Amina Otieno",
      subtitle: "For Kwame Mensah",
      rows: [
        { label: "Amount due", value: "KES 3,000.00", strong: true },
        { label: "Due date", value: "15/07/2026" },
        { label: "Payment method", value: "M-Pesa Paybill Number" },
        { label: "Receiving wallet", value: "Wallet B · KES" },
        { label: "Documents", value: "2 attached" },
      ],
    });
  });

  it("derives email preview content from the supplied draft", () => {
    const model = buildInvoicePreviewModel(
      makeDraft({
        invoiceTitle: "June platform services",
        invoiceId: "INV-2026-0099",
      }),
      "email",
    );

    expect(model.panel).toMatchObject({
      kind: "email",
      subject: "Subject: June platform services is ready",
      greeting: "Hi Kwame Mensah,",
      summary: {
        billerName: "Amina Otieno",
        invoiceId: "INV-2026-0099",
        amount: "KES 3,000.00",
      },
      dueDateLine: "Due date: 15/07/2026.",
      note: "Please reference PO-7788 when paying.",
      documentsLine: "2 supporting documents will be listed with the invoice.",
    });
  });
});

describe("resolveInvoicePreviewTab", () => {
  it("transitions to a valid next tab and keeps the current tab for invalid values", () => {
    expect(resolveInvoicePreviewTab("pdf", "payer")).toBe("payer");
    expect(resolveInvoicePreviewTab("payer", "email")).toBe("email");
    expect(resolveInvoicePreviewTab("email", "missing")).toBe("email");
  });
});

describe("resolveInvoicePreviewKeyboardTab", () => {
  it("moves to the next tab for ArrowRight and ArrowDown, wrapping at the end", () => {
    expect(resolveInvoicePreviewKeyboardTab("pdf", "ArrowRight")).toBe("payer");
    expect(resolveInvoicePreviewKeyboardTab("payer", "ArrowDown")).toBe("email");
    expect(resolveInvoicePreviewKeyboardTab("email", "ArrowRight")).toBe("pdf");
  });

  it("moves to the previous tab for ArrowLeft and ArrowUp, wrapping at the beginning", () => {
    expect(resolveInvoicePreviewKeyboardTab("email", "ArrowLeft")).toBe("payer");
    expect(resolveInvoicePreviewKeyboardTab("payer", "ArrowUp")).toBe("pdf");
    expect(resolveInvoicePreviewKeyboardTab("pdf", "ArrowLeft")).toBe("email");
  });

  it("moves to the first or last tab for Home and End", () => {
    expect(resolveInvoicePreviewKeyboardTab("email", "Home")).toBe("pdf");
    expect(resolveInvoicePreviewKeyboardTab("pdf", "End")).toBe("email");
  });

  it("keeps the current tab for unrelated keys", () => {
    expect(resolveInvoicePreviewKeyboardTab("payer", "Enter")).toBe("payer");
    expect(resolveInvoicePreviewKeyboardTab("payer", "Tab")).toBe("payer");
  });
});
