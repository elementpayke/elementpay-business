"use client";

import type { CountryCode } from "@/components/dashboard/dashboardData";
import { CountrySelect, TextField } from "@/components/invoices/formPrimitives";
import { invoiceCountries } from "@/components/invoices/invoiceData";
import type { PartyDetails } from "@/stores/invoiceStore";

type PartyDetailsCardProps = {
  title: string;
  role: "biller" | "client";
  value: PartyDetails;
  onChange: (patch: Partial<PartyDetails>) => void;
};

export default function PartyDetailsCard({ title, role, value, onChange }: PartyDetailsCardProps) {
  const isBiller = role === "biller";
  const countryData = invoiceCountries.find((c) => c.code === value.country);

  return (
    <section className="space-y-4">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1C2238]">{title}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          placeholder="First name"
          value={value.firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
        />
        <TextField
          label="Last name"
          placeholder="Last name"
          value={value.lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
        />
      </div>

      <TextField
        label="Email address"
        type="email"
        placeholder={isBiller ? "aly@example.com" : "client@example.com"}
        value={value.email}
        onChange={(e) => onChange({ email: e.target.value })}
      />

      <CountrySelect
        label={isBiller ? "Biller's country" : "Client's country"}
        value={value.country}
        onChange={(code: CountryCode) => onChange({ country: code })}
      />

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">
          Phone number <span className="ml-1 text-[#9CA3B6]">(optional)</span>
        </label>
        <div className="flex h-11 overflow-hidden rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] transition focus-within:border-primary-300 focus-within:bg-white">
          <div className="flex items-center gap-1.5 border-r border-[#ECEEF4] px-3 text-xs font-medium text-[#4D556D]">
            <span className="text-[#9CA3B6]">{countryData?.dialCode ?? "+---"}</span>
          </div>
          <input
            type="tel"
            inputMode="tel"
            placeholder="12349240023"
            value={value.phone}
            onChange={(e) => onChange({ phone: e.target.value.replace(/[^\d\s]/g, "") })}
            className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#1F2640] outline-none placeholder:text-[#9CA3B6]"
          />
        </div>
      </div>

      <TextField
        label="Address"
        optional
        placeholder="enter sample address here"
        value={value.address}
        onChange={(e) => onChange({ address: e.target.value })}
      />
    </section>
  );
}
