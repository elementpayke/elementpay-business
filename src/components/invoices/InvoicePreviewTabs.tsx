"use client";

import { useRef, useState, type KeyboardEvent } from "react";
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

export function getInvoicePreviewTabId(tabId: InvoicePreviewTabId) {
  return `invoice-preview-tab-${tabId}`;
}

export function getInvoicePreviewPanelId(tabId: InvoicePreviewTabId) {
  return `invoice-preview-panel-${tabId}`;
}

export type InvoicePreviewRowModel = {
  label: string;
  value: string;
  strong?: boolean;
};

export type InvoicePreviewPanelModel =
  | {
      kind: "pdf";
      compact: true;
    }
  | {
      kind: "payer";
      eyebrow: string;
      title: string;
      subtitle: string;
      rows: InvoicePreviewRowModel[];
    }
  | {
      kind: "email";
      subject: string;
      greeting: string;
      summary: {
        billerName: string;
        invoiceId: string;
        amount: string;
      };
      dueDateLine: string;
      note: string;
      documentsLine: string | null;
    };

export type InvoicePreviewModel = {
  activeTab: InvoicePreviewTabId;
  panel: InvoicePreviewPanelModel;
};

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

export function resolveInvoicePreviewTab(
  current: InvoicePreviewTabId,
  next: InvoicePreviewTabId | string,
): InvoicePreviewTabId {
  return invoicePreviewTabs.some((tab) => tab.id === next) ? (next as InvoicePreviewTabId) : current;
}

export function resolveInvoicePreviewKeyboardTab(
  current: InvoicePreviewTabId,
  key: string,
): InvoicePreviewTabId {
  const currentIndex = invoicePreviewTabs.findIndex((tab) => tab.id === current);
  const lastIndex = invoicePreviewTabs.length - 1;

  if (currentIndex === -1) return current;

  if (key === "ArrowRight" || key === "ArrowDown") {
    return invoicePreviewTabs[(currentIndex + 1) % invoicePreviewTabs.length].id;
  }

  if (key === "ArrowLeft" || key === "ArrowUp") {
    return invoicePreviewTabs[(currentIndex - 1 + invoicePreviewTabs.length) % invoicePreviewTabs.length].id;
  }

  if (key === "Home") return invoicePreviewTabs[0].id;
  if (key === "End") return invoicePreviewTabs[lastIndex].id;

  return current;
}

export function buildInvoicePreviewModel(
  draft: InvoiceDraft,
  activeTab: InvoicePreviewTabId = DEFAULT_INVOICE_PREVIEW_TAB,
): InvoicePreviewModel {
  if (activeTab === "pdf") {
    return {
      activeTab,
      panel: {
        kind: "pdf",
        compact: true,
      },
    };
  }

  const totals = calculateTotals(draft);
  const currency = draft.preferredCurrency || "USD";
  const billerName = partyName(draft.biller);
  const clientName = partyName(draft.client);

  if (activeTab === "payer") {
    const paymentMethod = getPaymentMethodLabel(draft);
    const wallet = receivingWallets.find((item) => item.id === draft.receivingWalletId);

    return {
      activeTab,
      panel: {
        kind: "payer",
        eyebrow: "Payer checkout",
        title: draft.invoiceTitle || `Invoice from ${billerName}`,
        subtitle: `For ${clientName}`,
        rows: [
          { label: "Amount due", value: formatInvoiceMoney(totals.total, currency), strong: true },
          { label: "Due date", value: formatDisplayDate(draft.dueDate) },
          { label: "Payment method", value: paymentMethod ?? "Not selected" },
          { label: "Receiving wallet", value: wallet ? `${wallet.label} · ${wallet.currency}` : "Not selected" },
          { label: "Documents", value: `${draft.supportingDocuments.length} attached` },
        ],
      },
    };
  }

  const documentCount = draft.supportingDocuments.length;

  return {
    activeTab,
    panel: {
      kind: "email",
      subject: `Subject: ${draft.invoiceTitle || `Invoice ${draft.invoiceId}`} is ready`,
      greeting: `Hi ${clientName},`,
      summary: {
        billerName,
        invoiceId: draft.invoiceId,
        amount: formatInvoiceMoney(totals.total, currency),
      },
      dueDateLine: `Due date: ${formatDisplayDate(draft.dueDate)}.`,
      note: draft.note,
      documentsLine:
        documentCount > 0
          ? `${documentCount} supporting document${documentCount === 1 ? "" : "s"} will be listed with the invoice.`
          : null,
    },
  };
}

export default function InvoicePreviewTabs() {
  const [activeTab, setActiveTab] = useState<InvoicePreviewTabId>(DEFAULT_INVOICE_PREVIEW_TAB);
  const tabRefs = useRef<Partial<Record<InvoicePreviewTabId, HTMLButtonElement | null>>>({});
  const draft = useInvoiceStore((s) => s.draft);
  const model = buildInvoicePreviewModel(draft, activeTab);

  function selectTab(nextTab: InvoicePreviewTabId) {
    setActiveTab((current) => resolveInvoicePreviewTab(current, nextTab));
  }

  function handleTabKeyDown(currentTab: InvoicePreviewTabId, event: KeyboardEvent<HTMLButtonElement>) {
    const nextTab = resolveInvoicePreviewKeyboardTab(currentTab, event.key);

    if (nextTab === currentTab) return;

    event.preventDefault();
    selectTab(nextTab);
    tabRefs.current[nextTab]?.focus();
  }

  return (
    <section className="min-w-0 rounded-xl border border-[#E8EBF3] bg-white">
      <div role="tablist" aria-label="Invoice preview" className="flex gap-1 border-b border-[#E8EBF3] p-1.5">
        {invoicePreviewTabs.map((tab) => {
          const active = tab.id === model.activeTab;
          return (
            <button
              key={tab.id}
              id={getInvoicePreviewTabId(tab.id)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={getInvoicePreviewPanelId(tab.id)}
              tabIndex={active ? 0 : -1}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              onClick={() => selectTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(tab.id, event)}
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

      <div
        id={getInvoicePreviewPanelId(model.activeTab)}
        role="tabpanel"
        aria-labelledby={getInvoicePreviewTabId(model.activeTab)}
        className="min-w-0 p-3 sm:p-4"
      >
        {model.panel.kind === "pdf" ? <InvoicePreview compact={model.panel.compact} /> : null}
        {model.panel.kind === "payer" ? <PayerPreview panel={model.panel} /> : null}
        {model.panel.kind === "email" ? <EmailPreview panel={model.panel} /> : null}
      </div>
    </section>
  );
}

function PayerPreview({ panel }: { panel: Extract<InvoicePreviewPanelModel, { kind: "payer" }> }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-[#F7F8FC] p-4">
        <div className="flex items-start gap-3">
          <MonitorSmartphone className="mt-0.5 h-5 w-5 text-primary-500" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#7E8498]">{panel.eyebrow}</p>
            <h3 className="mt-1 truncate text-lg font-semibold text-[#1A2138]">
              {panel.title}
            </h3>
            <p className="mt-1 text-sm text-[#5F667D]">{panel.subtitle}</p>
          </div>
        </div>
      </div>

      <dl className="space-y-3 text-sm">
        {panel.rows.map((row) => (
          <PreviewRow key={row.label} label={row.label} value={row.value} strong={row.strong} />
        ))}
      </dl>
    </div>
  );
}

function EmailPreview({ panel }: { panel: Extract<InvoicePreviewPanelModel, { kind: "email" }> }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[#8E93A7]">
          <Mail className="h-4 w-4" />
          Email
        </div>
        <p className="mt-3 text-sm font-semibold text-[#1A2138]">
          {panel.subject}
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[#ECEEF4] bg-white p-4 text-sm text-[#3F465E]">
        <p>{panel.greeting}</p>
        <p>
          {panel.summary.billerName} sent invoice{" "}
          <span className="font-semibold text-[#1A2138]">{panel.summary.invoiceId}</span> for{" "}
          <span className="font-semibold text-[#1A2138]">{panel.summary.amount}</span>.
        </p>
        <p>{panel.dueDateLine}</p>
        {panel.note ? <p className="whitespace-pre-line">{panel.note}</p> : null}
        <p className="font-medium text-primary-600">Review and pay invoice</p>
      </div>

      {panel.documentsLine ? (
        <div className="rounded-xl bg-[#F7F8FC] p-3 text-xs text-[#5F667D]">
          {panel.documentsLine}
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
