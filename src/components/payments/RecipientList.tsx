"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  cardClassName,
  UserAvatar,
} from "@/components/dashboard/DashboardPrimitives";
import {
  savedRecipients,
  type SavedRecipient,
} from "@/components/payments/paymentData";
import Flag from "@/components/dashboard/Flag";
import type { CountryCode } from "@/components/dashboard/dashboardData";

// Maps country name (from SavedRecipient.label) → CountryCode used by <Flag>
const LABEL_TO_CODE: Record<string, CountryCode> = {
  Kenya: "KE",
  Nigeria: "NG",
  Ghana: "GH",
};

type RecipientListProps = {
  onSelect: (recipient: SavedRecipient) => void;
};

export default function RecipientList({ onSelect }: RecipientListProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const recipients = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    if (!normalized) return savedRecipients;
    return savedRecipients.filter(
      (r) =>
        r.name.toLowerCase().includes(normalized) ||
        r.email.toLowerCase().includes(normalized),
    );
  }, [deferredQuery]);

  return (
    <div className={cardClassName("p-4 sm:p-5")}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-[#1D243C]">Select recipient</h2>
        <button className="text-sm font-medium text-primary-600 transition hover:text-primary-700">
          View all
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <label className="relative mt-4 block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0B5C7]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipients by name or email"
          className="h-11 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] pl-11 pr-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
        />
      </label>

      {/* ── Recipient rows ───────────────────────────────────────────────── */}
      <div className="mt-4 divide-y divide-[#EFF2F7]">
        {recipients.map((recipient) => {
          const countryCode = LABEL_TO_CODE[recipient.label];
          return (
            <button
              key={recipient.email}
              type="button"
              onClick={() => onSelect(recipient)}
              className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:bg-[#FAFBFE]"
            >
              {/* Avatar + name/email */}
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-[linear-gradient(135deg,#413ACB,#FF90A8)] p-[1.5px]">
                  <div className="rounded-full bg-white p-[1.5px]">
                    <UserAvatar name={recipient.name} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1D243C]">
                    {recipient.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#8E93A7]">
                    {recipient.email}
                  </p>
                </div>
              </div>

              {/* Country flag + label + payment method */}
              <div className="flex flex-col items-end gap-0.5">
                <div className="flex items-center gap-1.5">
                  {countryCode ? (
                    <Flag code={countryCode} size={16} />
                  ) : (
                    <span className="text-sm leading-none">{recipient.flag}</span>
                  )}
                  <p className="text-xs font-medium text-[#1D243C]">
                    {recipient.label}
                  </p>
                </div>
                <p className="text-xs text-[#8E93A7]">{recipient.paymentMethod}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
