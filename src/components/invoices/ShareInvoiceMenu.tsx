"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Loader2, Share2 } from "lucide-react";
import {
  buildInvoicePayload,
  validateInvoiceDraft,
} from "@/stores/invoicePayload";
import { useInvoiceStore } from "@/stores/invoiceStore";
import {
  getPublicLink,
  issueInvoice,
  saveInvoiceDraft,
} from "@/lib/invoices/api";

type ShareInvoiceMenuProps = {
  invoiceId: string;
  invoiceTitle?: string;
  clientName?: string;
  totalLabel?: string;
};

type Channel = {
  id: "twitter" | "whatsapp" | "linkedin";
  label: string;
  build: (url: string, text: string) => string;
  icon: React.ReactNode;
};

const channels: Channel[] = [
  {
    id: "twitter",
    label: "Share on X",
    build: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    icon: <XIcon />,
  },
  {
    id: "whatsapp",
    label: "Share on WhatsApp",
    build: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    icon: <WhatsAppIcon />,
  },
  {
    id: "linkedin",
    label: "Share on LinkedIn",
    build: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    icon: <LinkedInIcon />,
  },
];

export default function ShareInvoiceMenu({
  invoiceId,
  invoiceTitle,
  clientName,
  totalLabel,
}: ShareInvoiceMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draft = useInvoiceStore((s) => s.draft);
  const draftId = useInvoiceStore((s) => s.draftId);
  const setDraftId = useInvoiceStore((s) => s.setDraftId);
  const issued = useInvoiceStore((s) => s.issued);
  const setIssued = useInvoiceStore((s) => s.setIssued);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function ensurePublicUrl(): Promise<string> {
    let id = issued?.id ?? null;
    if (id == null) {
      const validation = validateInvoiceDraft(draft, "issued");
      if (validation.length > 0) {
        throw new Error(validation[0].message);
      }
      const payload = buildInvoicePayload(draft, "issued");
      const savedDraft = await saveInvoiceDraft(payload, draftId);
      setDraftId(savedDraft.id);
      const inv = await issueInvoice({
        draftId: savedDraft.id,
        sendVia: "none",
      });
      id = inv.id;
      setIssued({
        id: inv.id,
        invoiceNumber: inv.invoice_number,
        publicToken: inv.public_token,
      });
    }
    const link = await getPublicLink(id);
    return link.public_url;
  }

  function buildShareData(url: string) {
    const titlePart = invoiceTitle?.trim() || `Invoice ${invoiceId}`;
    const recipientPart = clientName?.trim() ? ` for ${clientName.trim()}` : "";
    const totalPart = totalLabel ? ` — ${totalLabel}` : "";
    const text = `${titlePart}${recipientPart}${totalPart}. Pay securely:`;
    return { url, text, title: titlePart };
  }

  async function handleNativeShare() {
    setError(null);
    try {
      setLoading(true);
      const url = await ensurePublicUrl();
      const { text, title } = buildShareData(url);
      const nav = typeof navigator !== "undefined" ? navigator : null;
      if (nav && typeof nav.share === "function") {
        try {
          await nav.share({ title, text, url });
          setOpen(false);
          return;
        } catch {
          // user cancelled or share failed — fall back to the popover
        }
      }
      setOpen((o) => !o);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare link");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleChannelClick(channel: Channel) {
    setError(null);
    try {
      setLoading(true);
      const url = await ensurePublicUrl();
      const { text } = buildShareData(url);
      const target = channel.build(url, text);
      window.open(target, "_blank", "noopener,noreferrer");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not prepare link");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    setError(null);
    try {
      setLoading(true);
      const url = await ensurePublicUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not copy link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleNativeShare}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition hover:text-primary-700 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        Share
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-[#ECEEF4] bg-white p-1.5 shadow-[0_18px_45px_rgba(16,24,40,0.12)]">
          {channels.map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => handleChannelClick(channel)}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#1F2640] transition hover:bg-[#F6F7FB] disabled:opacity-60"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F4F5F9] text-[#1F2640]">
                {channel.icon}
              </span>
              <span className="font-medium">{channel.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleCopyLink}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-[#1F2640] transition hover:bg-[#F6F7FB] disabled:opacity-60"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F4F5F9] text-[#1F2640]">
              {copied ? <Check className="h-4 w-4 text-tertiary-600" /> : <Link2 className="h-4 w-4" />}
            </span>
            <span className="font-medium">
              {copied ? "Link copied" : "Copy invoice link"}
            </span>
          </button>
          {error ? (
            <p className="px-3 pb-2 pt-1 text-[11px] text-[#E35D5B]">{error}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163A11.867 11.867 0 0 1 .003 11.92C0 5.34 5.373 0 11.95 0a11.85 11.85 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.488 8.414c-.003 6.58-5.376 11.92-11.95 11.92a11.96 11.96 0 0 1-5.708-1.454L.057 24Zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.04ZM17.472 14.382c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.867-2.03-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.602 0 4.267 2.37 4.267 5.455v6.288ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM6.973 20.452H3.7V9h3.273v11.452ZM22.225 0H1.771C.792 0 0 .775 0 1.732v20.536C0 23.227.792 24 1.771 24h20.451c.978 0 1.778-.773 1.778-1.732V1.732C24 .775 23.2 0 22.222 0h.003Z" />
    </svg>
  );
}
