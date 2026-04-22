"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import InvoicePreview from "@/components/invoices/InvoicePreview";
import SendInvoiceModal from "@/components/invoices/SendInvoiceModal";
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

export default function InvoicePreviewPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const draft = useInvoiceStore((s) => s.draft);
  const resetDraft = useInvoiceStore((s) => s.resetDraft);

  function handleEdit() {
    setModalOpen(false);
    router.push("/dashboard/invoices/create");
  }

  function handleSent() {
    resetDraft();
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
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
            Invoice Preview
          </h1>
        </div>
        <div className="flex items-center gap-5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => router.push("/dashboard/invoices/create")}
            className="text-primary-600 transition hover:text-primary-700"
          >
            Save to draft
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 text-primary-600 transition hover:text-primary-700"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/invoices/create")}
            className="text-primary-600 transition hover:text-primary-700"
          >
            Edit invoice
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-[#ECEEF5] bg-white p-8 shadow-[0_4px_30px_rgba(16,24,40,0.04)]">
        <InvoicePreview />
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="h-12 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
      >
        Send invoice
      </button>

      <SendInvoiceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        invoiceId={draft.invoiceId}
        clientEmail={draft.client.email}
        clientPhone={draft.client.phone}
        onEdit={handleEdit}
        onSent={handleSent}
      />
    </section>
  );
}
