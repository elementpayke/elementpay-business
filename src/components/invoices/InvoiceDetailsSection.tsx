"use client";

import { useInvoiceStore } from "@/stores/invoiceStore";
import { DatePicker, TextField } from "@/components/invoices/formPrimitives";

export default function InvoiceDetailsSection() {
  const draft = useInvoiceStore((s) => s.draft);
  const setDraft = useInvoiceStore((s) => s.setDraft);

  return (
    <section className="space-y-4">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1C2238]">Invoice details</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Invoice title"
          placeholder="e.g. Billing for Joseph Thuku"
          value={draft.invoiceTitle}
          onChange={(e) => setDraft((d) => ({ ...d, invoiceTitle: e.target.value }))}
        />
        <TextField
          label="Invoice ID"
          value={draft.invoiceId}
          readOnly
          className="bg-[#F4F5F9] text-[#6B7287]"
        />
        <DatePicker
          label="Issue date"
          value={draft.issueDate}
          onChange={(v) => setDraft((d) => ({ ...d, issueDate: v }))}
        />
        <DatePicker
          label="Due date"
          value={draft.dueDate}
          onChange={(v) => setDraft((d) => ({ ...d, dueDate: v }))}
        />
      </div>
    </section>
  );
}
