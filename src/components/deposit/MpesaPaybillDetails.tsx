"use client";

import { Copy } from "lucide-react";
import { useCopyToClipboard } from "@/lib/wallets/useCopyToClipboard";
import CopyToast from "@/components/wallets/CopyToast";

type MpesaPaybillDetailsProps = {
  businessNo: string;
  accountNo: string;
};

export default function MpesaPaybillDetails({
  businessNo,
  accountNo,
}: MpesaPaybillDetailsProps) {
  const { copy, toast } = useCopyToClipboard();

  return (
    <div className="space-y-3">
      <Row label="Business Number" value={businessNo} onCopy={() => copy(businessNo, "Business number copied")} />
      <Row label="Account Number" value={accountNo} onCopy={() => copy(accountNo, "Account number copied")} />

      <p className="text-xs leading-relaxed text-[#7E8498]">
        Use these details to pay via M-Pesa Paybill from your phone. Click &quot;Confirm deposit&quot;
        once you have completed the payment.
      </p>

      <CopyToast message={toast.message} visible={toast.visible} />
    </div>
  );
}

function Row({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3 py-2.5">
      <div className="flex flex-col">
        <span className="text-xs text-[#7E8498]">{label}</span>
        <span className="font-mono text-sm font-semibold text-[#1A2138]">{value}</span>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#ECEEF4] bg-white text-[#7E8498] transition hover:border-primary-200 hover:text-primary-500"
      >
        <Copy className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
