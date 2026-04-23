"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PageSize = 10 | 25 | 50;

type RecipientsTablePaginationProps = {
  page: number;
  pageSize: PageSize;
  totalRows: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
};

const PAGE_SIZES: PageSize[] = [10, 25, 50];

export default function RecipientsTablePagination({
  page,
  pageSize,
  totalRows,
  onPageChange,
  onPageSizeChange,
}: RecipientsTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = totalRows === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalRows);

  return (
    <div className="flex flex-col gap-3 border-t border-[#EFF1F7] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-xs text-[#6B7287]">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
          className="h-8 rounded-md border border-[#E1E4EE] bg-white px-2 text-xs text-[#1D243C] outline-none transition focus:border-primary-300"
          aria-label="Rows per page"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#6B7287]">
        <span>
          {start}-{end} of {totalRows}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E1E4EE] bg-white text-[#5C637A] transition hover:border-[#CBD2E5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-medium text-[#1D243C]">
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E1E4EE] bg-white text-[#5C637A] transition hover:border-[#CBD2E5] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
