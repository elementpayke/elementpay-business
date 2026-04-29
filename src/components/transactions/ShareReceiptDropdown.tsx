"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  ImageIcon,
  Link2,
  Mail,
  MessageCircle,
  MessageSquare,
  Share2,
} from "lucide-react";
import type { RecentTransactionRow } from "@/components/dashboard/dashboardData";

type ShareAction = "whatsapp" | "email" | "sms" | "pdf" | "image" | "link";

const SHARE_OPTIONS: Array<{
  id: ShareAction;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "whatsapp", label: "Share via WhatsApp", icon: MessageCircle },
  { id: "email", label: "Share via email", icon: Mail },
  { id: "sms", label: "Share via SMS", icon: MessageSquare },
  { id: "pdf", label: "Download PDF", icon: FileText },
  { id: "image", label: "Download image", icon: ImageIcon },
  { id: "link", label: "Copy link", icon: Link2 },
];

function receiptSummary(txn: RecentTransactionRow) {
  return `Receipt ${txn.id} — ${txn.client} — ${txn.amount} (${txn.status}) on ${txn.date}`;
}

export default function ShareReceiptDropdown({ txn }: { txn: RecentTransactionRow }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function handleShare(action: ShareAction) {
    const summary = receiptSummary(txn);
    const receiptUrl = `${window.location.origin}/dashboard/transactions/${txn.id}`;

    switch (action) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${summary}\n${receiptUrl}`)}`,
          "_blank",
          "noopener,noreferrer",
        );
        break;
      case "email":
        window.open(
          `mailto:?subject=${encodeURIComponent(`Receipt for ${txn.id}`)}&body=${encodeURIComponent(`${summary}\n\n${receiptUrl}`)}`,
          "_self",
        );
        break;
      case "sms":
        window.open(`sms:?body=${encodeURIComponent(`${summary} ${receiptUrl}`)}`, "_self");
        break;
      case "pdf":
      case "image":
        window.print();
        break;
      case "link":
        try {
          await navigator.clipboard.writeText(receiptUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* no-op */
        }
        break;
    }

    if (action !== "link") setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
      >
        <Share2 className="h-4 w-4" />
        Share receipt
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-3 w-[320px] rounded-2xl border border-[#ECEEF5] bg-white p-4 shadow-[0_24px_60px_rgba(16,24,40,0.14)] sm:w-[420px] dark:border-[#252840] dark:bg-[#13162A]">
          <div className="grid grid-cols-3 gap-1">
            {SHARE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isCopied = copied && opt.id === "link";
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleShare(opt.id)}
                  className="flex flex-col items-center gap-2.5 rounded-xl px-2 py-4 text-center transition hover:bg-[#F7F8FC] dark:hover:bg-[#1A1D2E]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100/70 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-[#2A3150] dark:text-[#C0C6DF]">
                    {isCopied ? "Copied!" : opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
