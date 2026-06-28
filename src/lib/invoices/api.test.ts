import { afterEach, describe, expect, it, vi } from "vitest";
import { buildDraftRequestBody, saveInvoiceDraft } from "@/lib/invoices/api";
import { buildInvoicePayload } from "@/stores/invoicePayload";
import { useInvoiceStore } from "@/stores/invoiceStore";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("creates a new draft when the stored draft id no longer exists", async () => {
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const payload = buildInvoicePayload(useInvoiceStore.getState().draft, "draft");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse(
          { status: "error", message: "Draft not found.", data: null },
          404,
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: "success",
            message: "Draft created.",
            data: {
              id: 42,
              business_id: 1,
              title: null,
              due_date: null,
              payload: {},
              created_at: null,
              updated_at: null,
            },
          },
          201,
        ),
      );

    const saved = await saveInvoiceDraft(payload, 1);

    expect(saved.id).toBe(42);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/v1/invoices/drafts/1",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/v1/invoices/drafts",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
