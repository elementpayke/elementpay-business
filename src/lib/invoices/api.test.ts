import { describe, expect, it } from "vitest";
import { buildDraftRequestBody } from "@/lib/invoices/api";
import { buildInvoicePayload } from "@/stores/invoicePayload";
import { useInvoiceStore } from "@/stores/invoiceStore";

describe("invoice draft API payload", () => {
  it("maps supporting document metadata for the backend and preserves rich details", () => {
    const richPayload = buildInvoicePayload(
      {
        ...useInvoiceStore.getState().draft,
        supportingDocuments: [
          {
            id: "doc-1",
            name: "invoice-attachment.pdf",
            sizeBytes: 555,
            mimeType: "application/pdf",
          },
        ],
      },
      "draft",
    );

    const body = buildDraftRequestBody(richPayload);

    expect(body.payload.supporting_documents).toEqual([
      {
        id: "doc-1",
        name: "invoice-attachment.pdf",
        size_bytes: 555,
        mime_type: "application/pdf",
      },
    ]);
    expect(body.payload.details).toBe(richPayload);
    expect(body.payload.details.supportingDocuments).toEqual(richPayload.supportingDocuments);
  });
});
