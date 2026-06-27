import { describe, expect, it } from "vitest";
import { DEFAULT_INVOICE_PREVIEW_TAB, invoicePreviewTabs } from "@/components/invoices/InvoicePreviewTabs";

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
});
