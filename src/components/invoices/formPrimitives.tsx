"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown } from "lucide-react";
import Flag from "@/components/dashboard/Flag";
import type { CountryCode } from "@/components/dashboard/dashboardData";
import {
  invoiceCountries,
  invoiceCurrencies,
  type CurrencyCode,
} from "@/components/invoices/invoiceData";

export const inputBaseClass =
  "h-11 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-sm text-[#1F2640] outline-none transition placeholder:text-[#9CA3B6] focus:border-primary-300 focus:bg-white";

export const labelBaseClass = "mb-1.5 block text-xs font-medium text-[#4D556D]";

export function FieldLabel({
  children,
  optional = false,
  className = "",
}: {
  children: React.ReactNode;
  optional?: boolean;
  className?: string;
}) {
  return (
    <label className={`${labelBaseClass} ${className}`}>
      {children}
      {optional ? <span className="ml-1 text-[#9CA3B6]">(optional)</span> : null}
    </label>
  );
}

type TextFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
  error?: string;
};

export function TextField({ label, optional, error, className = "", ...props }: TextFieldProps) {
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <input {...props} className={`${inputBaseClass} ${className}`} />
      {error ? <p className="mt-1.5 text-xs text-[#E35D5B]">{error}</p> : null}
    </div>
  );
}

type DatePickerProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  optional?: boolean;
};

export function DatePicker({ label, value, onChange, placeholder = "mm/dd/yyyy", optional }: DatePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <div
        className={`relative flex h-11 items-center rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] transition focus-within:border-primary-300 focus-within:bg-white`}
      >
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="peer h-full w-full appearance-none bg-transparent px-3.5 pr-10 text-sm text-[#1F2640] outline-none placeholder:text-[#9CA3B6] [&::-webkit-calendar-picker-indicator]:opacity-0"
          placeholder={placeholder}
        />
        <button
          type="button"
          aria-label="Open calendar"
          onClick={() => {
            const el = inputRef.current;
            if (!el) return;
            if (typeof el.showPicker === "function") {
              el.showPicker();
            } else {
              el.focus();
            }
          }}
          className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-md text-[#7E8498] transition hover:bg-[#ECEEF4] hover:text-[#1A2138]"
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

type CountrySelectProps = {
  label: string;
  value: CountryCode | "";
  onChange: (code: CountryCode) => void;
  optional?: boolean;
  placeholder?: string;
};

export function CountrySelect({
  label,
  value,
  onChange,
  optional,
  placeholder = "Select a country",
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = invoiceCountries.find((c) => c.code === value);

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-left text-sm text-[#1F2640] outline-none transition hover:border-[#D9DEEC] focus:border-primary-300 focus:bg-white"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <Flag code={selected.code} size={18} />
            <span>{selected.name}</span>
          </span>
        ) : (
          <span className="text-[#9CA3B6]">{placeholder}</span>
        )}
        <ChevronDown className={`h-4 w-4 text-[#9CA3B6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-[#ECEEF4] bg-white p-1.5 shadow-lg">
          {invoiceCountries.map((country) => {
            const active = country.code === value;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                  active ? "bg-primary-100/60 text-[#1A2138]" : "text-[#3F465E] hover:bg-[#F6F7FB]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Flag code={country.code} size={18} />
                  <span className="text-sm font-medium">{country.name}</span>
                  <span className="text-xs text-[#8E93A7]">{country.dialCode}</span>
                </span>
                {active ? <Check className="h-4 w-4 text-primary-500" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

type CurrencySelectProps = {
  label: string;
  value: CurrencyCode | "";
  onChange: (code: CurrencyCode) => void;
  placeholder?: string;
};

export function CurrencySelect({ label, value, onChange, placeholder = "Select currency" }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = invoiceCurrencies.find((c) => c.code === value);

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel>{label}</FieldLabel>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-left text-sm text-[#1F2640] outline-none transition hover:border-[#D9DEEC] focus:border-primary-300 focus:bg-white"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            {selected.country ? <Flag code={selected.country} size={18} /> : <CurrencyDot code={selected.code} />}
            <span>{selected.name}</span>
          </span>
        ) : (
          <span className="text-[#9CA3B6]">{placeholder}</span>
        )}
        <ChevronDown className={`h-4 w-4 text-[#9CA3B6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1.5 overflow-hidden rounded-xl border border-[#ECEEF4] bg-white p-1.5 shadow-lg">
          {invoiceCurrencies.map((currency) => {
            const active = currency.code === value;
            return (
              <button
                key={currency.code}
                type="button"
                onClick={() => {
                  onChange(currency.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                  active ? "bg-primary-100/60 text-[#1A2138]" : "text-[#3F465E] hover:bg-[#F6F7FB]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {currency.country ? (
                    <Flag code={currency.country} size={18} />
                  ) : (
                    <CurrencyDot code={currency.code} />
                  )}
                  <span className="text-sm font-medium">{currency.name}</span>
                  <span className="text-xs text-[#8E93A7]">{currency.code}</span>
                </span>
                {active ? <Check className="h-4 w-4 text-primary-500" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function CurrencyDot({ code }: { code: CurrencyCode }) {
  return (
    <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700">
      {code[0]}
    </span>
  );
}

type SelectDropdownOption = { value: string; label: string; description?: string };

type SelectDropdownProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectDropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  optional?: boolean;
};

export function SelectDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  optional,
}: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel optional={optional}>{label}</FieldLabel>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-left text-sm text-[#1F2640] outline-none transition hover:border-[#D9DEEC] focus:border-primary-300 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={selected ? "text-[#1F2640]" : "text-[#9CA3B6]"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-[#9CA3B6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && options.length > 0 ? (
        <div className="absolute left-0 right-0 z-20 mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-[#ECEEF4] bg-white p-1.5 shadow-lg">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition ${
                  active ? "bg-primary-100/60 text-[#1A2138]" : "text-[#3F465E] hover:bg-[#F6F7FB]"
                }`}
              >
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  {option.description ? (
                    <span className="mt-0.5 block text-[11px] text-[#8E93A7]">{option.description}</span>
                  ) : null}
                </span>
                {active ? <Check className="h-4 w-4 text-primary-500" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 ${className}`}>
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
          checked
            ? "border-primary-500 bg-primary-500 text-white"
            : "border-[#CDD2E0] bg-white text-transparent hover:border-primary-300"
        }`}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      {label ? <span className="text-sm text-[#3F465E]">{label}</span> : null}
    </label>
  );
}
