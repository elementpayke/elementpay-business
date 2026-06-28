import { describe, expect, it } from "vitest";
import { buildInvoiceWhatsAppShareUrl } from "@/lib/invoices/share";

describe("invoice share links", () => {
  it("builds a WhatsApp share URL with invoice context and a cleaned phone number", () => {
    const url = new URL(
      buildInvoiceWhatsAppShareUrl({
        publicUrl: "http://localhost:8000/api/public/v1/invoices/token-123",
        invoiceNumber: "inv-2026-0002",
        clientName: "Jane Wangari",
        toPhone: "+254 712 345 678",
      }),
    );

    expect(`${url.origin}${url.pathname}`).toBe("https://wa.me/254712345678");
    expect(url.searchParams.get("text")).toBe(
      "Invoice inv-2026-0002 for Jane Wangari is ready. Pay securely: http://localhost:8000/api/public/v1/invoices/token-123",
    );
  });
});
