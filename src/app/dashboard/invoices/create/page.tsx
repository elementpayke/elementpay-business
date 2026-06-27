"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import InvoiceWorkspace from "@/components/invoices/InvoiceWorkspace";
import { useInvoiceStore } from "@/stores/invoiceStore";
import { buildInvoicePayload, validateInvoiceDraft } from "@/stores/invoicePayload";
import { createDraft, updateDraft } from "@/lib/invoices/api";

export default function CreateInvoicePage() {
  const router = useRouter();
  const draft = useInvoiceStore((s) => s.draft);
  const draftId = useInvoiceStore((s) => s.draftId);
  const setDraftId = useInvoiceStore((s) => s.setDraftId);
  const resetDraft = useInvoiceStore((s) => s.resetDraft);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);

  function handleDiscard() {
    if (confirm("Discard this invoice? All entered details will be cleared.")) {
      resetDraft();
      router.push("/dashboard");
    }
  }

  async function handleSaveDraft() {
    setDraftError(null);
    setDraftStatus(null);
    const validation = validateInvoiceDraft(draft, "draft");
    if (validation.length > 0) {
      setDraftError(validation[0].message);
      return;
    }
    setSavingDraft(true);
    try {
      const payload = buildInvoicePayload(draft, "draft");
      const saved =
        draftId != null
          ? await updateDraft(draftId, payload)
          : await createDraft(payload);
      setDraftId(saved.id);
      setDraftStatus("Draft saved");
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Could not save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleProceed() {
    setDraftError(null);
    const validation = validateInvoiceDraft(draft, "issued");
    if (validation.length > 0) {
      setDraftError(validation[0].message);
      return;
    }
    // Auto-save the latest state to the backend draft before previewing so
    // the preview page issues against a fresh server-side draft snapshot.
    setSavingDraft(true);
    try {
      const payload = buildInvoicePayload(draft, "draft");
      const saved =
        draftId != null
          ? await updateDraft(draftId, payload)
          : await createDraft(payload);
      setDraftId(saved.id);
      router.push("/dashboard/invoices/preview");
    } catch (err) {
      setDraftError(
        err instanceof Error
          ? err.message
          : "Could not save invoice before preview",
      );
    } finally {
      setSavingDraft(false);
    }
  }

  return (
    <InvoiceWorkspace
      savingDraft={savingDraft}
      draftError={draftError}
      draftStatus={draftStatus}
      onBack={() => router.back()}
      onDiscard={handleDiscard}
      onSaveDraft={handleSaveDraft}
      onProceed={handleProceed}
    />
  );
}
