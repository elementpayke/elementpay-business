"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { useInvoiceStore, type SupportingDocumentMetadata } from "@/stores/invoiceStore";

export const MAX_SUPPORTING_DOCUMENTS = 10;
export const MAX_SUPPORTING_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024;

type FileMetadataInput = Pick<File, "name" | "size" | "type">;

type BuildSupportingDocumentResult = {
  accepted: SupportingDocumentMetadata[];
  errors: string[];
};

function makeDocumentId(file: FileMetadataInput) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `doc-${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildSupportingDocumentMetadata(
  files: FileMetadataInput[],
  existingDocs: SupportingDocumentMetadata[],
  idFactory: (file: FileMetadataInput) => string = makeDocumentId,
): BuildSupportingDocumentResult {
  const accepted: SupportingDocumentMetadata[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_SUPPORTING_DOCUMENT_SIZE_BYTES) {
      errors.push(`${file.name} is larger than 20MB.`);
      continue;
    }

    if (existingDocs.length + accepted.length >= MAX_SUPPORTING_DOCUMENTS) {
      if (!errors.includes("Only 10 supporting documents can be attached.")) {
        errors.push("Only 10 supporting documents can be attached.");
      }
      continue;
    }

    accepted.push({
      id: idFactory(file),
      name: file.name,
      sizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
    });
  }

  return { accepted, errors };
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (sizeBytes >= 1024) {
    return `${Math.ceil(sizeBytes / 1024)} KB`;
  }
  return `${sizeBytes} B`;
}

export default function SupportingDocumentsDropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const documents = useInvoiceStore((s) => s.draft.supportingDocuments);
  const addSupportingDocument = useInvoiceStore((s) => s.addSupportingDocument);
  const removeSupportingDocument = useInvoiceStore((s) => s.removeSupportingDocument);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const result = buildSupportingDocumentMetadata(files, documents);
    result.accepted.forEach(addSupportingDocument);
    setError(result.errors[0] ?? null);
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1C2238]">
          Supporting documents
        </h2>
        <p className="mt-1 text-xs text-[#7E8498]">
          Attach up to 10 metadata-only documents. Each document can be up to 20MB.
        </p>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          addFiles(event.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition ${
          dragActive
            ? "border-primary-400 bg-primary-100/40"
            : "border-[#CDD2E0] bg-[#FAFBFE] hover:border-primary-300 hover:bg-white"
        }`}
      >
        <UploadCloud className="h-6 w-6 text-primary-500" />
        <span className="mt-2 text-sm font-semibold text-[#1F2640]">Upload supporting document</span>
        <span className="mt-1 text-xs text-[#7E8498]">PDF, image, spreadsheet, or text metadata</span>
      </button>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => {
          if (event.target.files) addFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      {error ? <p className="text-xs font-medium text-[#E35D5B]">{error}</p> : null}

      {documents.length > 0 ? (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#ECEEF4] bg-white px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-primary-500" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-[#1F2640]">{document.name}</span>
                  <span className="block text-xs text-[#8E93A7]">
                    {formatFileSize(document.sizeBytes)} · {document.mimeType}
                  </span>
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeSupportingDocument(document.id)}
                aria-label={`Remove ${document.name}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#E35D5B] transition hover:bg-[#FFF5F4]"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
