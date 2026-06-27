import { describe, expect, it } from "vitest";
import {
  buildSupportingDocumentMetadata,
  getSupportingDocumentErrorAnnouncementProps,
  MAX_SUPPORTING_DOCUMENTS,
  MAX_SUPPORTING_DOCUMENT_SIZE_BYTES,
} from "@/components/invoices/SupportingDocumentsDropzone";
import type { SupportingDocumentMetadata } from "@/stores/invoiceStore";

function fileLike(name: string, size: number, type = "application/pdf") {
  return { name, size, type } as File;
}

describe("buildSupportingDocumentMetadata", () => {
  it("returns metadata for accepted files without retaining File objects", () => {
    const result = buildSupportingDocumentMetadata(
      [fileLike("purchase-order.pdf", 2048)],
      [],
      () => "doc-1",
    );

    expect(result.accepted).toEqual([
      {
        id: "doc-1",
        name: "purchase-order.pdf",
        sizeBytes: 2048,
        mimeType: "application/pdf",
      },
    ]);
    expect(result.accepted[0]).not.toHaveProperty("file");
    expect(result.errors).toEqual([]);
  });

  it("rejects files larger than 20MB", () => {
    const result = buildSupportingDocumentMetadata(
      [fileLike("huge-contract.pdf", MAX_SUPPORTING_DOCUMENT_SIZE_BYTES + 1)],
      [],
      () => "doc-oversized",
    );

    expect(result.accepted).toEqual([]);
    expect(result.errors).toEqual(["huge-contract.pdf is larger than 20MB."]);
  });

  it("rejects files that exceed the 10 document total", () => {
    const existingDocs: SupportingDocumentMetadata[] = Array.from(
      { length: MAX_SUPPORTING_DOCUMENTS - 1 },
      (_, index) => ({
        id: `existing-${index}`,
        name: `existing-${index}.pdf`,
        sizeBytes: 100,
        mimeType: "application/pdf",
      }),
    );

    const result = buildSupportingDocumentMetadata(
      [fileLike("accepted.pdf", 100), fileLike("rejected.pdf", 100)],
      existingDocs,
      (file) => `doc-${file.name}`,
    );

    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].name).toBe("accepted.pdf");
    expect(result.errors).toEqual(["Only 10 supporting documents can be attached."]);
  });
});

describe("getSupportingDocumentErrorAnnouncementProps", () => {
  it("marks validation errors as polite status updates", () => {
    expect(getSupportingDocumentErrorAnnouncementProps()).toEqual({
      role: "status",
      "aria-live": "polite",
    });
  });
});
