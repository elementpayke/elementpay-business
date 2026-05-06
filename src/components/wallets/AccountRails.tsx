"use client";

import { Copy } from "lucide-react";
import type { ReactNode } from "react";
import type { LiveWallet } from "@/lib/wallets/types";
import { shortAddress } from "@/lib/wallets/wallet-selection";

type CopyHandler = (value: string, message?: string) => void;

function IconButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded-md text-foreground-muted hover:bg-surface-muted hover:text-foreground transition"
    >
      {children}
    </button>
  );
}

// Section header — one subtle line underneath, no ALL CAPS
function SectionHeader({ title, onCopyDetails }: { title: string; onCopyDetails?: () => void }) {
  return (
    <div className="flex items-center justify-between pb-2 border-b border-border/40">
      <h3 className="text-xs font-semibold text-foreground-muted">{title}</h3>
      {onCopyDetails && (
        <button
          onClick={onCopyDetails}
          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 transition"
        >
          <Copy className="h-3 w-3" />
          Copy details
        </button>
      )}
    </div>
  );
}

// Field row — no harsh border, just padding gives the separation
function FieldRow({
  label,
  value,
  onCopy,
  trailing,
}: {
  label: string;
  value: ReactNode;
  onCopy?: () => void;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <span className="text-sm text-foreground-muted">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-foreground">{value}</span>
        {trailing}
        {onCopy && (
          <IconButton onClick={onCopy}>
            <Copy className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>
    </div>
  );
}

export default function AccountRails({
  wallet,
  copy,
  onEditName,
}: {
  wallet: LiveWallet;
  copy: CopyHandler;
  onEditName?: () => void;
}) {
  return (
    <div className="space-y-7">

      {/* ── ACCOUNT DETAILS ── */}
      <div className="space-y-0">
        <SectionHeader title="Account details" />
        <FieldRow
          label="Wallet name"
          value={wallet.label}
          trailing={
            <button
              onClick={onEditName}
              className="ml-2 text-xs text-primary-600 hover:text-primary-700 transition"
            >
              Edit
            </button>
          }
        />
        <FieldRow
          label="Wallet ID"
          value={shortAddress(wallet.address)}
          onCopy={() => copy(wallet.address, "Wallet ID copied")}
        />
      </div>

      {/* ── BANK DETAILS ── */}
      <div className="space-y-0">
        <SectionHeader
          title="Bank details"
          onCopyDetails={() =>
            copy(
              "Equity Bank | 1234567890 | ElementPay Virtual Account",
              "Bank details copied"
            )
          }
        />
        <FieldRow label="Bank name" value="Equity Bank" />
        <FieldRow
          label="Account number"
          value="1234567890"
          onCopy={() => copy("1234567890", "Account number copied")}
        />
        <FieldRow
          label="Account name"
          value="ElementPay Virtual Account"
          onCopy={() => copy("ElementPay Virtual Account", "Account name copied")}
        />
      </div>

      {/* ── M-PESA PAYBILL DETAILS ── */}
      <div className="space-y-0">
        <SectionHeader
          title="M-Pesa Paybill details"
          onCopyDetails={() =>
            copy(
              "Paybill: 1234567890 | Account: 1234567890 | Business: Business Name Plc",
              "M-Pesa details copied"
            )
          }
        />
        <FieldRow label="Paybill number" value="1234567890" />
        <FieldRow
          label="Paybill account number"
          value="1234567890"
          onCopy={() => copy("1234567890", "Paybill account copied")}
        />
        <FieldRow label="Business name" value="Business Name Plc" />
      </div>

      {/* ── USD DIRECT DEPOSIT DETAILS ── */}
      <div className="space-y-0">
        <SectionHeader
          title="USD Direct Deposit details"
          onCopyDetails={() =>
            copy(
              "Example Bank | 1234567890 | Business Name Plc | SWIFT: 2389201",
              "USD deposit details copied"
            )
          }
        />
        <FieldRow label="Bank name" value="Example Bank" />
        <FieldRow
          label="Bank account number"
          value="1234567890"
          onCopy={() => copy("1234567890", "USD account number copied")}
        />
        <FieldRow
          label="Account name"
          value="Business Name Plc"
          onCopy={() => copy("Business Name Plc", "Account name copied")}
        />
        <FieldRow label="SWIFT/BIC" value="2389201" />
      </div>

    </div>
  );
}