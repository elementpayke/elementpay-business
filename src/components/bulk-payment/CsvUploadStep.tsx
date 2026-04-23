"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import CsvUploadDropzone from "@/components/bulk-payment/CsvUploadDropzone";
import UploadValidationSummary from "@/components/bulk-payment/UploadValidationSummary";
import { parseAndValidateFile } from "@/lib/payments/bulkCsv";
import { useBulkPaymentStore } from "@/stores/bulkPaymentStore";

const TEMPLATE_HREF = "/templates/bulk-payment-template.csv";

export default function CsvUploadStep() {
  const uploadedFile = useBulkPaymentStore((s) => s.uploadedFile);
  const parseResult = useBulkPaymentStore((s) => s.parseResult);
  const setUploadedFile = useBulkPaymentStore((s) => s.setUploadedFile);
  const setParseResult = useBulkPaymentStore((s) => s.setParseResult);
  const setPhase = useBulkPaymentStore((s) => s.setPhase);

  const [parsing, setParsing] = useState(false);

  async function handleFile(file: File) {
    setParsing(true);
    setUploadedFile({ name: file.name, size: file.size, lastModified: file.lastModified });
    try {
      const result = await parseAndValidateFile(file);
      setParseResult(result);
    } finally {
      setParsing(false);
    }
  }

  const hasValid = (parseResult?.summary.validCount ?? 0) > 0;
  const hasBlockingErrors =
    (parseResult?.fileErrors.length ?? 0) > 0 || (parseResult?.headerErrors.length ?? 0) > 0;

  const dropzoneState: "idle" | "parsing" | "valid" | "invalid" = parsing
    ? "parsing"
    : !parseResult
    ? "idle"
    : hasBlockingErrors || !hasValid
    ? "invalid"
    : "valid";

  const summaryLine = (() => {
    if (!uploadedFile) return null;
    if (parsing) return "Parsing and validating rows…";
    if (hasBlockingErrors) return "We couldn't process this file";
    if (!parseResult) return null;
    const { summary } = parseResult;
    if (summary.validCount === 0) return `${summary.totalRows} row${summary.totalRows === 1 ? "" : "s"} — 0 valid`;
    return `${summary.validCount} contact${summary.validCount === 1 ? "" : "s"} found • CSV ${
      summary.invalidCount === 0 ? "valid" : "partially valid"
    }`;
  })();

  return (
    <div className={cardClassName("space-y-5 p-5 sm:p-6")}>
      <CsvUploadDropzone
        state={dropzoneState}
        fileName={uploadedFile?.name ?? null}
        summaryLine={summaryLine}
        onFileSelected={handleFile}
      />

      {parseResult ? <UploadValidationSummary result={parseResult} /> : null}

      <a
        href={TEMPLATE_HREF}
        download
        className="inline-flex items-center gap-2 self-center text-sm font-semibold text-primary-600 transition hover:text-primary-700"
      >
        <Download className="h-4 w-4" />
        Download CSV template for M-Pesa Mobile Payment
      </a>

      <button
        type="button"
        disabled={!hasValid || parsing || hasBlockingErrors}
        onClick={() => setPhase("recipients-preview")}
        className="h-12 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#B4B9CC] disabled:text-white"
      >
        Confirm CSV file upload
      </button>
    </div>
  );
}
