"use client";

import type { BulkParsedRow } from "@/lib/payments/bulkTypes";

type RecipientsPreviewTableProps = {
  rows: BulkParsedRow[];
};

function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function RecipientsPreviewTable({ rows }: RecipientsPreviewTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E7EAF3] bg-[#FAFBFE] py-12 text-center text-sm text-[#8D92A6]">
        No recipients match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="sticky top-0 z-10 bg-white">
          <tr className="text-left text-[11px] font-medium text-[#9298AC]">
            <th className="pb-3 pr-4 font-medium">#</th>
            <th className="pb-3 pr-4 font-medium">Recipient</th>
            <th className="pb-3 pr-4 font-medium">Identifier</th>
            <th className="pb-3 pr-4 font-medium">Country</th>
            <th className="pb-3 pr-4 font-medium">Payment method</th>
            <th className="pb-3 pr-4 text-right font-medium">Amount</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const valid = row.status === "valid";
            return (
              <tr
                key={`${row.rowIndex}-${row.payload.recipientIdentifier}`}
                className="border-t border-[#F0F2F7] text-[#1D243C] transition hover:bg-[#FAFBFE]"
              >
                <td className="py-3 pr-4 text-[#8D92A6]">{row.rowIndex}</td>
                <td className="py-3 pr-4 font-medium">{row.payload.recipientName || "—"}</td>
                <td className="py-3 pr-4 text-[#4D556D]">{row.payload.recipientIdentifier || "—"}</td>
                <td className="py-3 pr-4 text-[#4D556D]">{row.payload.country || "—"}</td>
                <td className="py-3 pr-4 text-[#4D556D]">{row.payload.paymentMethod || "—"}</td>
                <td className="py-3 pr-4 text-right font-medium">
                  {row.payload.currency || ""} {formatAmount(row.payload.amount)}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={`inline-flex rounded-md border px-2 py-1 text-[11px] font-medium leading-none ${
                      valid
                        ? "border-tertiary-300 bg-tertiary-50 text-tertiary-700"
                        : "border-[#FBC9C9] bg-[#FFE5E5] text-[#E25555]"
                    }`}
                  >
                    {valid ? "Valid" : "Invalid"}
                  </span>
                </td>
                <td className="py-3 pr-4 text-xs text-[#8D92A6]">
                  {valid ? "—" : row.errors.join("; ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
