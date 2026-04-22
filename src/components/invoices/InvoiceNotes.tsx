"use client";

import { useInvoiceStore } from "@/stores/invoiceStore";

export default function InvoiceNotes() {
  const draft = useInvoiceStore((s) => s.draft);
  const setDraft = useInvoiceStore((s) => s.setDraft);
  return (
    <section>
      <label className="mb-2 block text-xs font-medium text-[#4D556D]">
        Note to client <span className="ml-1 text-[#9CA3B6]">(Optional)</span>
      </label>
      <textarea
        value={draft.note}
        onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
        placeholder="Add a note to the client..."
        rows={4}
        className="w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3 text-sm text-[#1F2640] outline-none transition placeholder:text-[#9CA3B6] focus:border-primary-300 focus:bg-white"
      />
    </section>
  );
}
