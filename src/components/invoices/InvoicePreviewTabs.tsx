"use client";

import { useState } from "react";
import { Mail, MonitorSmartphone } from "lucide-react";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import {
  findCountry,
  paymentMethodsByCountry,
  receivingWallets,
} from "@/components/invoices/invoiceData";
import {
  calculateTotals,
  formatInvoiceMoney,
  useInvoiceStore,
  type InvoiceDraft,
} from "@/stores/invoiceStore";

export type InvoicePreviewTabId = "pdf" | "payer" | "email";

export const invoicePreviewTabs: { id: InvoicePreviewTabId; label: string }[] = [
  { id: "pdf", label: "PDF Preview" },
  { id: "payer", label: "Payer Preview" },
  { id: "email", label: "Email Preview" },
];

export const DEFAULT_INVOICE_PREVIEW_TAB: InvoicePreviewTabId = "pdf";

function partyName(party: InvoiceDraft["client"]) {
  return [party.firstName, party.lastName].filter(Boolean).join(" ") || "Client";
}

function getPaymentMethodLabel(draft: InvoiceDraft) {
  const clientCountry = findCountry(draft.client.country);
  const methodList = clientCountry ? paymentMethodsByCountry[clientCountry.code] : [];
  return methodList.find((method) => method.id === draft.preferredPaymentMethod)?.label;
}

function formatDisplayDate(iso: string) {
  if (!iso) return "Not set";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

export default function InvoicePreviewTabs() {
  const [activeTab, setActiveTab] = useState<InvoicePreviewTabId>(DEFAULT_INVOICE_PREVIEW_TAB);
  const draft = useInvoiceStore((s) => s.draft);

  return (
    <section className="min-w-0 rounded-xl border border-[#E8EBF3] bg-white">
      <div className="flex gap-1 border-b border-[#E8EBF3] p-1.5">
        {invoicePreviewTabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-w-0 flex-1 rounded-lg px-2.5 py-2 text-xs font-semibold transition ${
                active
                  ? "bg-primary-500 text-white"
                  : "text-[#5F667D] hover:bg-[#F6F7FB] hover:text-[#1F2640]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-w-0 p-3 sm:p-4">
        {activeTab === "pdf" ? <InvoicePreview compact /> : null}
        {activeTab === "payer" ? <PayerPreview draft={draft} /> : null}
        {activeTab === "email" ? <EmailPreview draft={draft} /> : null}
      </div>
    </section>
  );
}

function PayerPreview({ draft }: { draft: InvoiceDraft }) {
  const totals = calculateTotals(draft);
  const currency = draft.preferredCurrency || "USD";
  const billerName = partyName(draft.biller);
  const clientName = partyName(draft.client);
  const paymentMethod = getPaymentMethodLabel(draft);
  const wallet = receivingWallets.find((item) => item.id === draft.receivingWalletId);

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#F7F8FC] p-4">
        <div className="flex items-start gap-3">
          <MonitorSmartphone className="mt-0.5 h-5 w-5 text-primary-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7E8498]">Payer checkout</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-[#1A2138]">
              {draft.invoiceTitle || `Invoice from ${billerName}`}
            </h3>
            <p className="mt-1 text-sm text-[#5F667D]">For {clientName}</p>
          </div>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        <PreviewRow label="Amount due" value={formatInvoiceMoney(totals.total, currency)} strong />
        <PreviewRow label="Due date" value={formatDisplayDate(draft.dueDate)} />
        <PreviewRow label="Payment method" value={paymentMethod ?? "Not selected"} />
        <PreviewRow label="Receiving wallet" value={wallet ? `${wallet.label} · ${wallet.currency}` : "Not selected"} />
        <PreviewRow label="Documents" value={`${draft.supportingDocuments.length} attached`} />
      </dl>
    </div>
  );
}

function EmailPreview({ draft }: { draft: InvoiceDraft }) {
  const totals = calculateTotals(draft);
  const currency = draft.preferredCurrency || "USD";
  const billerName = partyName(draft.biller);
  const clientName = partyName(draft.client);
  const amount = formatInvoiceMoney(totals.total, currency);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#8E93A7]">
          <Mail className="h-4 w-4" />
          Email
        </div>
        <p className="mt-3 text-sm font-semibold text-[#1A2138]">
          Subject: {draft.invoiceTitle || `Invoice ${draft.invoiceId}`} is ready
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#ECEEF4] bg-white p-4 text-sm text-[#3F465E]">
        <p>Hi {clientName},</p>
        <p>
          {billerName} sent invoice <span className="font-semibold text-[#1A2138]">{draft.invoiceId}</span> for{" "}
          <span className="font-semibold text-[#1A2138]">{amount}</span>.
        </p>
        <p>Due date: {formatDisplayDate(draft.dueDate)}.</p>
        {draft.note ? <p className="whitespace-pre-line">{draft.note}</p> : null}
        <p className="font-medium text-primary-600">Review and pay invoice</p>
      </div>

      {draft.supportingDocuments.length > 0 ? (
        <div className="rounded-xl bg-[#F7F8FC] p-3 text-xs text-[#5F667D]">
          {draft.supportingDocuments.length} supporting document
          {draft.supportingDocuments.length === 1 ? "" : "s"} will be listed with the invoice.
        </div>
      ) : null}
    </div>
  );
}

function PreviewRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-[#ECEEF4] pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[#7E8498]">{label}</dt>
      <dd className={`text-right ${strong ? "text-base font-bold text-tertiary-500" : "font-medium text-[#1A2138]"}`}>
        {value}
      </dd>
    </div>
  );
}
