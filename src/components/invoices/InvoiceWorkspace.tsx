"use client";

import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import InvoiceDetailsSection from "@/components/invoices/InvoiceDetailsSection";
import InvoiceNotes from "@/components/invoices/InvoiceNotes";
import InvoicePreviewTabs from "@/components/invoices/InvoicePreviewTabs";
import LineItemsTable from "@/components/invoices/LineItemsTable";
import PartyDetailsCard from "@/components/invoices/PartyDetailsCard";
import PaymentDetailsSection from "@/components/invoices/PaymentDetailsSection";
import PricingSummary from "@/components/invoices/PricingSummary";
import SupportingDocumentsDropzone from "@/components/invoices/SupportingDocumentsDropzone";
import { useInvoiceStore } from "@/stores/invoiceStore";

type InvoiceWorkspaceProps = {
  savingDraft: boolean;
  draftError: string | null;
  draftStatus: string | null;
  onBack: () => void;
  onDiscard: () => void;
  onSaveDraft: () => void;
  onProceed: () => void;
};

function HistoryButton({
  disabled = false,
  onClick,
  children,
  ariaLabel,
}: {
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7EAF3] bg-white text-[#6B7287] transition hover:border-[#CDD2E0] hover:text-[#2A3150] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export default function InvoiceWorkspace({
  savingDraft,
  draftError,
  draftStatus,
  onBack,
  onDiscard,
  onSaveDraft,
  onProceed,
}: InvoiceWorkspaceProps) {
  return (
    <section className="min-w-0 pb-24 lg:pb-8">
      <header className="sticky top-0 z-20 -mx-4 border-b border-[#E8EBF3] bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pb-5 lg:pt-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden items-center gap-1 sm:flex">
              <HistoryButton onClick={onBack} ariaLabel="Back">
                <ChevronLeft className="h-4 w-4" />
              </HistoryButton>
              <HistoryButton disabled ariaLabel="Forward">
                <ChevronRight className="h-4 w-4" />
              </HistoryButton>
            </div>
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7EAF3] bg-white text-[#6B7287] sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[24px] font-semibold tracking-[-0.02em] text-[#171D32]">
                Create Invoice
              </h1>
              <p className="mt-1 text-sm text-[#7E8498]">Build, review, and prepare the invoice in one workspace.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onDiscard}
              className="text-sm font-semibold text-[#E35D5B] transition hover:text-[#BF3F3D]"
            >
              Discard invoice
            </button>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={savingDraft}
                className="h-10 rounded-lg bg-primary-100/70 px-4 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
              >
                {savingDraft ? "Saving..." : "Save to draft"}
              </button>
              <StatusText draftError={draftError} draftStatus={draftStatus} />
            </div>
            <button
              type="button"
              onClick={onProceed}
              disabled={savingDraft}
              className="hidden h-10 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60 sm:inline-flex sm:items-center"
            >
              {savingDraft ? "Preparing..." : "Proceed to invoice preview"}
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <main className="min-w-0 space-y-5">
          <WorkspacePanel>
            <InvoiceDetailsSection />
          </WorkspacePanel>

          <WorkspacePanel>
            <div className="grid gap-8 lg:grid-cols-2">
              <BillerCardContainer />
              <ClientCardContainer />
            </div>
          </WorkspacePanel>

          <WorkspacePanel>
            <PaymentDetailsSection />
          </WorkspacePanel>

          <WorkspacePanel flushOnMobile>
            <div className="-mx-2 overflow-x-auto px-2">
              <div className="min-w-[760px]">
                <LineItemsTable />
              </div>
            </div>
          </WorkspacePanel>

          <WorkspacePanel>
            <PricingSummary />
          </WorkspacePanel>

          <WorkspacePanel>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <InvoiceNotes />
              <SupportingDocumentsDropzone />
            </div>
          </WorkspacePanel>
        </main>

        <aside className="min-w-0 xl:sticky xl:top-6 xl:self-start">
          <InvoicePreviewTabs />
        </aside>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E8EBF3] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(31,38,64,0.08)] backdrop-blur lg:left-[var(--dashboard-sidebar-width,0px)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#E7EAF3] bg-white px-4 text-sm font-semibold text-[#3F465E] transition hover:border-[#CDD2E0]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 sm:block">
              <StatusText draftError={draftError} draftStatus={draftStatus} />
            </div>
            <button
              type="button"
              onClick={onProceed}
              disabled={savingDraft}
              className="h-11 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
            >
              {savingDraft ? "Preparing..." : "Next"}
            </button>
          </div>
        </div>
      </footer>
    </section>
  );
}

function WorkspacePanel({
  children,
  flushOnMobile = false,
}: {
  children: React.ReactNode;
  flushOnMobile?: boolean;
}) {
  return (
    <section
      className={`min-w-0 rounded-xl border border-[#E8EBF3] bg-white ${
        flushOnMobile ? "px-2 py-4 sm:p-5" : "p-4 sm:p-5"
      }`}
    >
      {children}
    </section>
  );
}

function StatusText({ draftError, draftStatus }: { draftError: string | null; draftStatus: string | null }) {
  if (draftError) {
    return <span className="max-w-[280px] text-xs text-[#E35D5B]">{draftError}</span>;
  }
  if (draftStatus) {
    return <span className="text-xs text-tertiary-600">{draftStatus}</span>;
  }
  return null;
}

function BillerCardContainer() {
  const biller = useInvoiceStore((s) => s.draft.biller);
  const updateBiller = useInvoiceStore((s) => s.updateBiller);
  return <PartyDetailsCard title="Biller's details" role="biller" value={biller} onChange={updateBiller} />;
}

function ClientCardContainer() {
  const client = useInvoiceStore((s) => s.draft.client);
  const updateClient = useInvoiceStore((s) => s.updateClient);
  return <PartyDetailsCard title="Client's details" role="client" value={client} onChange={updateClient} />;
}
