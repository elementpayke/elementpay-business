"use client";

import { use } from "react";
import Link from "next/link";
import { Clock, FileText } from "lucide-react";

export default function PublicInvoicePage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = use(params);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FC] px-5 py-12">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-[#ECEEF5] bg-white p-8 text-center shadow-[0_8px_40px_rgba(16,24,40,0.06)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-[#171D32]">
            Invoice {invoiceId}
          </h1>
          <p className="text-sm text-[#6B7287]">
            This payment page is being prepared. Once the issuer publishes the
            invoice, you&apos;ll be able to view the line items and pay securely
            from here.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#F4F5F9] px-4 py-3 text-xs font-medium text-[#4D556D]">
          <Clock className="h-3.5 w-3.5" />
          Awaiting issuer confirmation
        </div>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-primary-600 transition hover:text-primary-700"
        >
          Go to ElementPay
        </Link>
      </div>
    </main>
  );
}
