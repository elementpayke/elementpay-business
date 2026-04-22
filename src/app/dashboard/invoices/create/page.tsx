"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InvoiceDetailsSection from "@/components/invoices/InvoiceDetailsSection";
import InvoiceNotes from "@/components/invoices/InvoiceNotes";
import LineItemsTable from "@/components/invoices/LineItemsTable";
import PartyDetailsCard from "@/components/invoices/PartyDetailsCard";
import PaymentDetailsSection from "@/components/invoices/PaymentDetailsSection";
import PricingSummary from "@/components/invoices/PricingSummary";
import { useInvoiceStore } from "@/stores/invoiceStore";

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

export default function CreateInvoicePage() {
  const router = useRouter();
  const resetDraft = useInvoiceStore((s) => s.resetDraft);
  const [savingDraft, setSavingDraft] = useState(false);

  function handleDiscard() {
    if (confirm("Discard this invoice? All entered details will be cleared.")) {
      resetDraft();
      router.push("/dashboard");
    }
  }

  function handleSaveDraft() {
    setSavingDraft(true);
    setTimeout(() => setSavingDraft(false), 1000);
  }

  function handleProceed() {
    router.push("/dashboard/invoices/preview");
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8EBF3] pb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <HistoryButton onClick={() => router.back()} ariaLabel="Back">
              <ChevronLeft className="h-4 w-4" />
            </HistoryButton>
            <HistoryButton disabled ariaLabel="Forward">
              <ChevronRight className="h-4 w-4" />
            </HistoryButton>
          </div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[#171D32]">
            Create Invoice
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-semibold text-[#E35D5B] transition hover:text-[#BF3F3D]"
          >
            Discard invoice
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="h-10 rounded-lg bg-primary-100/70 px-4 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
          >
            {savingDraft ? "Saving..." : "Save to draft"}
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="h-10 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Proceed to invoice preview
          </button>
        </div>
      </header>

      <InvoiceDetailsSection />

      <div className="grid gap-8 border-t border-[#E8EBF3] pt-6 lg:grid-cols-2">
        <BillerCardContainer />
        <ClientCardContainer />
      </div>

      <div className="border-t border-[#E8EBF3] pt-6">
        <PaymentDetailsSection />
      </div>

      <div className="border-t border-[#E8EBF3] pt-6">
        <LineItemsTable />
      </div>

      <div className="border-t border-[#E8EBF3] pt-6">
        <PricingSummary />
      </div>

      <div className="border-t border-[#E8EBF3] pt-6">
        <InvoiceNotes />
      </div>
    </section>
  );
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
