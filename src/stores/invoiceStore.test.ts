import { beforeEach, describe, expect, it } from "vitest";
import { useInvoiceStore } from "@/stores/invoiceStore";

describe("invoice store supporting documents", () => {
  beforeEach(() => {
    useInvoiceStore.getState().resetDraft();
  });

  it("adds and removes supporting document metadata", () => {
    const metadata = {
      id: "doc-1",
      name: "purchase-order.pdf",
      sizeBytes: 12345,
      mimeType: "application/pdf",
    };

    useInvoiceStore.getState().addSupportingDocument(metadata);

    expect(useInvoiceStore.getState().draft.supportingDocuments).toEqual([metadata]);

    useInvoiceStore.getState().removeSupportingDocument("doc-1");

    expect(useInvoiceStore.getState().draft.supportingDocuments).toEqual([]);
  });

  it("clears supporting document metadata when resetting the draft", () => {
    useInvoiceStore.getState().addSupportingDocument({
      id: "doc-2",
      name: "delivery-note.png",
      sizeBytes: 2048,
      mimeType: "image/png",
    });

    useInvoiceStore.getState().resetDraft();

    expect(useInvoiceStore.getState().draft.supportingDocuments).toEqual([]);
  });
});
