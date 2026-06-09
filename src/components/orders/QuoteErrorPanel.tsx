"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, RefreshCw, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { NormalizedQuoteError } from "@/lib/orderErrors";

type QuoteErrorPanelProps = {
  error: NormalizedQuoteError;
  /** Called when the user taps Retry. Omit to hide the retry button. */
  onRetry?: () => void;
  /** True while a retry is in flight. */
  isRetrying?: boolean;
  /** Where the "Complete verification" CTA links to (kyc errors only). */
  verificationHref?: string;
};

/**
 * Renders an order-flow error with two levels of detail:
 *   - the plain `userMessage` up top (always visible),
 *   - a collapsible "Technical details" disclosure with `devDetail` for
 *     debugging (hidden by default).
 *
 * The primary action adapts to the error kind: KYC errors point at
 * verification, everything retryable offers a Retry button.
 */
export default function QuoteErrorPanel({
  error,
  onRetry,
  isRetrying = false,
  verificationHref = "/dashboard/verification",
}: QuoteErrorPanelProps) {
  const [showDetail, setShowDetail] = useState(false);
  const isKyc = error.kind === "kyc";

  return (
    <div className="rounded-xl border border-[#F5B5B3] bg-[#FFF4F3] p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-[#D9534F]">
          {isKyc ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#8A2A25]">{error.title}</p>
          <p className="mt-1 text-sm text-[#A1352F]">{error.userMessage}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isKyc ? (
              <Link
                href={verificationHref}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-500 px-3.5 text-sm font-semibold text-white transition hover:brightness-105"
              >
                <ShieldCheck className="h-4 w-4" />
                Complete verification
              </Link>
            ) : null}

            {onRetry && error.retryable ? (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E4A6A3] bg-white px-3.5 text-sm font-semibold text-[#A1352F] transition hover:bg-[#FFECEB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Retrying…" : "Try again"}
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#9A6763] transition hover:text-[#7A4B47]"
            aria-expanded={showDetail}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showDetail ? "rotate-180" : ""}`}
            />
            Technical details
          </button>

          {showDetail ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#E8C4C2] bg-[#FFF9F8] p-2.5 text-[11px] leading-relaxed text-[#7A4B47]">
              {error.devDetail}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
}
