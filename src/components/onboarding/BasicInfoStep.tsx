"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Loader2 } from "lucide-react";
import CountrySelect from "@/components/auth/CountrySelect";
import { COUNTRIES, type Country } from "@/lib/countries";
import type { BasicInfoProfile } from "@/lib/onboarding/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const inputClass =
  "w-full h-12 px-4 rounded-xl border-0 bg-gray-100 dark:bg-gray-800/70 text-gray-900 dark:text-white text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25 transition-all";

const labelClass =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

function NativeSelect({
  id,
  value,
  onChange,
  children,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={`${inputClass} appearance-none pr-10 ${value ? "" : "text-gray-400 dark:text-gray-500"}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  );
}

interface BasicInfoStepProps {
  initial: BasicInfoProfile | null;
  onSubmit: (profile: BasicInfoProfile) => Promise<void> | void;
}

function findCountry(name: string): Country | null {
  return COUNTRIES.find((c) => c.name === name) ?? null;
}

function findByDial(dial: string): Country | null {
  return COUNTRIES.find((c) => c.dialCode === dial) ?? null;
}

export default function BasicInfoStep({ initial, onSubmit }: BasicInfoStepProps) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? "");
  const [lastName, setLastName] = useState(initial?.lastName ?? "");
  const [country, setCountry] = useState<Country | null>(
    initial?.country ? findCountry(initial.country) : null,
  );
  const [dialCountry, setDialCountry] = useState<Country | null>(
    initial?.countryCode ? findByDial(initial.countryCode) : null,
  );
  const [phoneNumber, setPhoneNumber] = useState(initial?.phoneNumber ?? "");
  const [dobDay, setDobDay] = useState(initial?.dateOfBirth.day ?? "");
  const [dobMonth, setDobMonth] = useState(initial?.dateOfBirth.month ?? "");
  const [dobYear, setDobYear] = useState(initial?.dateOfBirth.year ?? "");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const out: number[] = [];
    for (let y = current - 18; y >= current - 100; y--) out.push(y);
    return out;
  }, []);

  const handleCountryChange = (c: Country) => {
    setCountry(c);
    if (!dialCountry) setDialCountry(c);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) return setError("First name is required.");
    if (!lastName.trim()) return setError("Last name is required.");
    if (!country) return setError("Select your country of residence.");
    if (!dialCountry) return setError("Select a country code for your phone.");
    if (!phoneNumber.trim()) return setError("Phone number is required.");

    const dobProvided = dobDay || dobMonth || dobYear;
    if (dobProvided && !(dobDay && dobMonth && dobYear)) {
      return setError("Please complete your date of birth or leave it empty.");
    }

    const digits = phoneNumber.replace(/\D/g, "");
    const normalizedPhone = digits
      ? `${dialCountry.dialCode}${digits.replace(/^0+/, "")}`
      : "";

    const profile: BasicInfoProfile = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      country: country.name,
      countryCode: dialCountry.dialCode,
      phoneNumber: normalizedPhone,
      dateOfBirth: { day: dobDay, month: dobMonth, year: dobYear },
    };

    setSubmitting(true);
    try {
      await onSubmit(profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className={labelClass}>
            First Name
          </label>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            placeholder="Enter first name"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="lastName" className={labelClass}>
            Last Name
          </label>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            placeholder="Enter last name"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="country" className={labelClass}>
          Country of Residence
        </label>
        <CountrySelect
          id="country"
          value={country?.code ?? null}
          onChange={handleCountryChange}
          placeholder="Select country"
          tone="soft"
          ariaLabel="Country of residence"
        />
      </div>

      <div>
        <label htmlFor="phoneNumber" className={labelClass}>
          Phone Number
        </label>
        <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[160px_1fr] gap-3">
          <CountrySelect
            value={dialCountry?.code ?? null}
            onChange={setDialCountry}
            variant="dial"
            tone="soft"
            ariaLabel="Phone country code"
          />
          <input
            id="phoneNumber"
            type="tel"
            inputMode="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            autoComplete="tel-national"
            placeholder="700 000 000"
            className={inputClass}
            required
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>
          Date of Birth{" "}
          <span className="font-normal text-gray-400 dark:text-gray-500">(Optional)</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          <NativeSelect id="dobDay" value={dobDay} onChange={setDobDay} ariaLabel="Day of birth">
            <option value="">Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={String(d)}>
                {d}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            id="dobMonth"
            value={dobMonth}
            onChange={setDobMonth}
            ariaLabel="Month of birth"
          >
            <option value="">Month</option>
            {MONTHS.map((m, idx) => (
              <option key={m} value={String(idx + 1)}>
                {m}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            id="dobYear"
            value={dobYear}
            onChange={setDobYear}
            ariaLabel="Year of birth"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold h-12 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:shadow-none disabled:cursor-not-allowed"
      >
        {submitting ? (
          <Loader2 className="w-4.5 h-4.5 animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
