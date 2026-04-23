"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { BulkParseResult } from "@/lib/payments/bulkTypes";

type UploadValidationSummaryProps = {
  result: BulkParseResult;
};

export default function UploadValidationSummary({ result }: UploadValidationSummaryProps) {
  const hasFileErrors = result.fileErrors.length > 0 || result.headerErrors.length > 0;

  if (hasFileErrors) {
    return (
      <div className="rounded-xl border border-[#F5B4BE] bg-[#FFF2F4] p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE3E7] text-[#D1455C]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-[#B23A4E]">We couldn&apos;t read this file</h4>
            <ul className="mt-2 space-y-1 text-xs text-[#8B4250]">
              {result.fileErrors.map((err) => (
                <li key={`file-${err}`}>• {err}</li>
              ))}
              {result.headerErrors.map((err) => (
                <li key={`header-${err}`}>• {err}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const { summary } = result;
  const allValid = summary.invalidCount === 0 && summary.validCount > 0;

  if (summary.validCount === 0) {
    return (
      <div className="rounded-xl border border-[#F5B4BE] bg-[#FFF2F4] p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE3E7] text-[#D1455C]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#B23A4E]">No valid recipients found</h4>
            <p className="mt-1 text-xs text-[#8B4250]">
              All {summary.totalRows} row{summary.totalRows === 1 ? "" : "s"} have validation errors. Review the preview
              to see per-row reasons.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        allValid
          ? "border-tertiary-300 bg-tertiary-50"
          : "border-[#F5D69A] bg-[#FFF8E5]"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
              allValid ? "bg-tertiary-100 text-tertiary-700" : "bg-[#FDE6B3] text-[#A5721B]"
            }`}
          >
            {allValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
          <div>
            <h4 className={`text-sm font-semibold ${allValid ? "text-tertiary-700" : "text-[#8A5F1A]"}`}>
              {summary.validCount} contact{summary.validCount === 1 ? "" : "s"} found
              {allValid ? " • CSV valid" : " • some rows need attention"}
            </h4>
            <p className={`mt-1 text-xs ${allValid ? "text-tertiary-700/80" : "text-[#8A5F1A]/90"}`}>
              {summary.invalidCount > 0
                ? `${summary.invalidCount} row${summary.invalidCount === 1 ? "" : "s"} will be skipped unless corrected.`
                : "Every row passed validation and is ready to be paid."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip label="Total rows" value={summary.totalRows} tone="neutral" />
          <Chip label="Valid" value={summary.validCount} tone="valid" />
          <Chip label="Invalid" value={summary.invalidCount} tone={summary.invalidCount > 0 ? "invalid" : "neutral"} />
        </div>
      </div>
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | "valid" | "invalid";
}) {
  const styles =
    tone === "valid"
      ? "border-tertiary-300 bg-white text-tertiary-700"
      : tone === "invalid"
      ? "border-[#F5B4BE] bg-white text-[#B23A4E]"
      : "border-[#E1E4EE] bg-white text-[#5C637A]";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium ${styles}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
