"use client";

import { useEffect, useState } from "react";
import { Check, Link2, Loader2, X } from "lucide-react";
import { Checkbox } from "@/components/invoices/formPrimitives";
import {
  buildInvoicePayload,
  validateInvoiceDraft,
} from "@/stores/invoicePayload";
import {
  type IssuedInvoiceSummary,
  useInvoiceStore,
} from "@/stores/invoiceStore";
import {
  getPublicLink,
  issueInvoice,
  saveInvoiceDraft,
  sendInvoice,
  type SendVia,
} from "@/lib/invoices/api";
import { buildInvoiceWhatsAppShareUrl } from "@/lib/invoices/share";
import { buildInvoiceSendPlan } from "@/lib/invoices/sendPlan";

type SendChannel = "email" | "whatsapp";

type SendInvoiceModalProps = {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  clientEmail?: string;
  clientPhone?: string;
  onEdit: () => void;
  onSent?: (channels: SendChannel[]) => void;
};

export default function SendInvoiceModal(props: SendInvoiceModalProps) {
  if (!props.open) return null;
  return <SendInvoiceModalBody {...props} />;
}

function SendInvoiceModalBody({
  onClose,
  clientEmail,
  clientPhone,
  onEdit,
  onSent,
}: SendInvoiceModalProps) {
  const draft = useInvoiceStore((s) => s.draft);
  const draftId = useInvoiceStore((s) => s.draftId);
  const setDraftId = useInvoiceStore((s) => s.setDraftId);
  const issued = useInvoiceStore((s) => s.issued);
  const setIssued = useInvoiceStore((s) => s.setIssued);
  const [channels, setChannels] = useState<Set<SendChannel>>(new Set());
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function toggleChannel(channel: SendChannel, next: boolean) {
    setChannels((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(channel);
      else copy.delete(channel);
      return copy;
    });
  }

  async function ensureDraftSaved(): Promise<number> {
    const payload = buildInvoicePayload(draft, "issued");
    const saved = await saveInvoiceDraft(payload, draftId);
    setDraftId(saved.id);
    return saved.id;
  }

  async function ensureIssuedInvoice(
    sendVia: SendVia = "none",
  ): Promise<IssuedInvoiceSummary> {
    if (issued?.id != null) return issued;

    const savedDraftId = await ensureDraftSaved();
    const inv = await issueInvoice({
      draftId: savedDraftId,
      sendVia,
    });
    const nextIssued = {
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      publicToken: inv.public_token,
    };
    setIssued(nextIssued);
    return nextIssued;
  }

  async function openWhatsAppShare(invoice: IssuedInvoiceSummary) {
    const link = await getPublicLink(invoice.id);
    const payload = buildInvoicePayload(draft, "issued");
    const target = buildInvoiceWhatsAppShareUrl({
      publicUrl: link.public_url,
      invoiceNumber: invoice.invoiceNumber,
      clientName: payload.client.fullName,
      toPhone: payload.client.phone.e164 ?? payload.client.phone.raw,
    });
    const opened = window.open(target, "_blank");
    if (opened) {
      opened.opener = null;
    } else {
      window.location.href = target;
    }
  }

  async function handleCopyLink() {
    setSendError(null);
    setLinkLoading(true);
    try {
      const validation = validateInvoiceDraft(draft, "issued");
      if (validation.length > 0) {
        throw new Error(validation[0].message);
      }
      const invoice = await ensureIssuedInvoice();
      const link = await getPublicLink(invoice.id);
      await navigator.clipboard.writeText(link.public_url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : "Could not copy invoice link",
      );
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleSend() {
    if (channels.size === 0) return;
    setSendError(null);
    const validation = validateInvoiceDraft(draft, "issued");
    if (validation.length > 0) {
      setSendError(validation[0].message);
      return;
    }
    setSendState("sending");
    try {
      const selectedChannels = Array.from(channels);
      const plan = buildInvoiceSendPlan(selectedChannels);
      let invoice = await ensureIssuedInvoice(plan.issueSendVia);

      if (plan.backendSendVia) {
        const inv = await sendInvoice({
          invoiceId: invoice.id,
          sendVia: plan.backendSendVia,
          toEmail: draft.client.email || null,
          toPhoneE164: null,
        });
        invoice = {
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          publicToken: inv.public_token,
        };
        setIssued(invoice);
      }

      if (plan.shouldOpenWhatsApp) {
        await openWhatsAppShare(invoice);
      }

      setSendState("sent");
      onSent?.(selectedChannels);
    } catch (err) {
      setSendState("idle");
      setSendError(err instanceof Error ? err.message : "Could not send invoice");
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="send-invoice-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E1129]/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#ECEEF5] bg-white shadow-[0_24px_60px_rgba(16,24,40,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6">
          <h3 id="send-invoice-title" className="text-lg font-semibold text-[#1A2138]">
            Send Invoice Via
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close send invoice modal"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 transition hover:text-primary-700"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        {sendState === "sent" ? (
          <SentState channels={Array.from(channels)} onClose={onClose} />
        ) : (
          <>
            <div className="px-6 pt-2">
              <p className="text-sm text-[#7E8498]">
                How would you like to send this invoice? Select all that apply
              </p>
            </div>

            <div className="mt-4 divide-y divide-[#ECEEF4] px-6">
              <ChannelOption
                checked={channels.has("email")}
                onChange={(next) => toggleChannel("email", next)}
                title="Send via email"
                description={
                  clientEmail
                    ? `Send this invoice to ${clientEmail}.`
                    : "Send this invoice to the client's email entered in the invoice."
                }
              />
              <ChannelOption
                checked={channels.has("whatsapp")}
                onChange={(next) => toggleChannel("whatsapp", next)}
                title="Send via WhatsApp"
                description={
                  clientPhone
                    ? `Send this invoice to ${clientPhone} via WhatsApp.`
                    : "Send this invoice to the client via WhatsApp."
                }
              />
            </div>

            <div className="px-6 pt-4">
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={linkLoading}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-700 disabled:opacity-60"
              >
                {linkLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Preparing link…
                  </>
                ) : linkCopied ? (
                  <>
                    <Check className="h-4 w-4" /> Link copied
                  </>
                ) : (
                  <>
                    Copy invoice link
                    <Link2 className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            {sendError ? (
              <p className="px-6 pt-3 text-xs text-[#E35D5B]" role="alert">
                {sendError}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-2 gap-3 bg-[#FAFBFE] px-6 py-5">
              <button
                type="button"
                onClick={onEdit}
                className="h-11 rounded-xl bg-primary-100/70 text-sm font-semibold text-primary-700 transition hover:bg-primary-100"
              >
                Edit invoice
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={channels.size === 0 || sendState === "sending"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {sendState === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  "Send invoice"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChannelOption({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-4">
      <span className="pt-0.5">
        <Checkbox checked={checked} onChange={onChange} />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-[#1A2138]">{title}</span>
        <span className="mt-0.5 block text-xs text-[#7E8498]">{description}</span>
      </span>
    </label>
  );
}

function SentState({ channels, onClose }: { channels: SendChannel[]; onClose: () => void }) {
  const channelLabels: Record<SendChannel, string> = {
    email: "email",
    whatsapp: "WhatsApp",
  };
  const summary = channels.map((c) => channelLabels[c]).join(" and ");
  return (
    <div className="space-y-4 px-6 pb-6 pt-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tertiary-100 text-tertiary-600">
        <Check className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1A2138]">Invoice sent</p>
        <p className="mt-1 text-xs text-[#7E8498]">
          {channels.length > 0
            ? `We've dispatched the invoice via ${summary}.`
            : "Invoice dispatched."}
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="h-11 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
      >
        Close
      </button>
    </div>
  );
}
