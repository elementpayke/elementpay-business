import { describe, expect, it } from "vitest";
import { buildInvoicePayload } from "@/stores/invoicePayload";
import { useInvoiceStore } from "@/stores/invoiceStore";

describe("buildInvoicePayload supporting documents", () => {
  it("includes metadata only in the rich invoice payload", () => {
    const draft = {
      ...useInvoiceStore.getState().draft,
      supportingDocuments: [
        {
          id: "doc-1",
          name: "signed-contract.pdf",
          sizeBytes: 98765,
          mimeType: "application/pdf",
          file: new File(["bytes"], "signed-contract.pdf"),
          fileBytes: new Uint8Array([1, 2, 3]),
        },
      ],
    };

    const payload = buildInvoicePayload(draft, "draft");

    expect(payload.supportingDocuments).toEqual([
      {
        id: "doc-1",
        name: "signed-contract.pdf",
        sizeBytes: 98765,
        mimeType: "application/pdf",
      },
    ]);
    expect(JSON.stringify(payload.supportingDocuments)).not.toContain("file");
    expect(JSON.stringify(payload.supportingDocuments)).not.toContain("fileBytes");
  });
});
