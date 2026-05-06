"use client";

import { Plus, Trash2 } from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import type { CountryCode } from "@/components/dashboard/dashboardData";

export type Beneficiary = {
  id: string;
  name: string;
  email: string;
  country: CountryCode;
  rail: string;
  lastUsed?: string;
};

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-teal-100 text-teal-700",
];

function avatarPalette(name: string) {
  const idx =
    name
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    AVATAR_PALETTES.length;

  return AVATAR_PALETTES[idx];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }

  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function BeneficiaryRow({
  beneficiary,
  onRemove,
}: {
  beneficiary: Beneficiary;
  onRemove?: (id: string) => void;
}) {
  const palette = avatarPalette(beneficiary.name);

  return (
    <li
      className="
        flex items-center gap-3 rounded-xl border px-4 py-3 transition
        border-border bg-surface
      "
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${palette}`}
      >
        {initials(beneficiary.name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {beneficiary.name}
        </p>

        <p className="truncate text-xs text-foreground-muted">
          {beneficiary.email}
        </p>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
        <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
          <Flag code={beneficiary.country} size={13} />
          {beneficiary.country}
        </span>

        <span className="text-[11px] text-foreground-muted">
          {beneficiary.rail}
        </span>
      </div>

      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${beneficiary.name}`}
          onClick={() => onRemove(beneficiary.id)}
          className="
            ml-1 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5
            text-[11px] font-medium text-[#E35D5B] transition
            hover:bg-rose-50
          "
        >
          <Trash2 className="h-3 w-3" />
          <span className="hidden sm:inline">Remove</span>
        </button>
      )}
    </li>
  );
}

export default function BeneficiariesTable({
  beneficiaries,
  onAdd,
  onRemove,
  onRemoveAll,
}: {
  beneficiaries: Beneficiary[];
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onRemoveAll?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-foreground-muted">
          Saved recipients funded directly from this wallet.
        </p>

        <button
          type="button"
          onClick={onAdd}
          className="
            inline-flex shrink-0 items-center gap-1.5 rounded-lg
            bg-primary-500 px-3 py-2 text-xs font-semibold text-white
            transition hover:brightness-105
          "
        >
          <Plus className="h-3.5 w-3.5" />
          Add beneficiary
        </button>
      </div>

      {beneficiaries.length === 0 ? (
        <div
          className="
            rounded-xl border border-dashed px-5 py-10 text-center
            border-border bg-surface
          "
        >
          <p className="text-sm font-medium text-foreground">
            No beneficiaries yet
          </p>

          <p className="mt-1 text-xs text-foreground-muted">
            Save recipients to send payments faster from this wallet.
          </p>

          <button
            type="button"
            onClick={onAdd}
            className="
              mt-4 inline-flex items-center gap-1.5 rounded-lg border
              px-4 py-2 text-xs font-semibold transition
              border-border bg-surface text-foreground
              hover:border-primary-300 hover:text-primary-700
            "
          >
            <Plus className="h-3.5 w-3.5" />
            Add first beneficiary
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground-muted">
              Saved beneficiaries
            </p>

            {onRemoveAll && (
              <button
                type="button"
                onClick={onRemoveAll}
                className="
                  text-[11px] font-medium text-[#E35D5B]
                  transition hover:text-rose-600
                "
              >
                Remove all
              </button>
            )}
          </div>

          <ul className="space-y-2">
            {beneficiaries.map((b) => (
              <BeneficiaryRow
                key={b.id}
                beneficiary={b}
                onRemove={onRemove}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}