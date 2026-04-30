"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import CountrySelect from "@/components/auth/CountrySelect";
import { COUNTRIES, type Country } from "@/lib/countries";
import {
  emptyBusinessDetails,
  emptyStakeholder,
  type BusinessDetails,
  type DateOfBirth,
  type NoahEntityType,
  type NoahRelationshipType,
  type Stakeholder,
} from "@/lib/onboarding/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

const ENTITY_TYPE_OPTIONS: { value: NoahEntityType; label: string }[] = [
  { value: "LimitedLiabilityCompany", label: "Limited Liability Company (LLC)" },
  { value: "PublicCompany", label: "Public Company" },
  { value: "SoleProprietorship", label: "Sole Proprietorship" },
  { value: "Partnership", label: "Partnership" },
  { value: "Corporation", label: "Corporation" },
  { value: "Trust", label: "Trust" },
  { value: "PrivateFoundation", label: "Private Foundation" },
  { value: "Charity", label: "Charity" },
  { value: "NonProfitOrganization", label: "Non-Profit Organization" },
  { value: "PublicAgency", label: "Public Agency" },
];

const RELATIONSHIP_OPTIONS: { value: NoahRelationshipType; label: string }[] = [
  { value: "UBO", label: "UBO" },
  { value: "Representative", label: "Representative" },
  { value: "Director", label: "Director" },
  { value: "Signatory", label: "Signatory" },
];

const inputClass =
  "w-full h-10 px-3 rounded-lg border-0 bg-gray-100 dark:bg-gray-800/70 text-gray-900 dark:text-white text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25";

const labelClass =
  "block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5";

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
        className={`${inputClass} appearance-none pr-7 ${value ? "" : "text-gray-400 dark:text-gray-500"}`}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
      {children}
    </h3>
  );
}

function DateGroup({
  value,
  onChange,
  ariaPrefix,
  yearStart,
  yearEnd,
}: {
  value: DateOfBirth;
  onChange: (patch: Partial<DateOfBirth>) => void;
  ariaPrefix: string;
  yearStart: number;
  yearEnd: number;
}) {
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = yearStart; y >= yearEnd; y--) out.push(y);
    return out;
  }, [yearStart, yearEnd]);

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
      <NativeSelect value={value.day} onChange={(v) => onChange({ day: v })} ariaLabel={`${ariaPrefix} day`}>
        <option value="">Day</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={String(d)}>{d}</option>
        ))}
      </NativeSelect>
      <NativeSelect value={value.month} onChange={(v) => onChange({ month: v })} ariaLabel={`${ariaPrefix} month`}>
        <option value="">Month</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={String(i + 1)}>{m}</option>
        ))}
      </NativeSelect>
      <NativeSelect value={value.year} onChange={(v) => onChange({ year: v })} ariaLabel={`${ariaPrefix} year`}>
        <option value="">Year</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}</option>
        ))}
      </NativeSelect>
    </div>
  );
}

interface BusinessDetailsStepProps {
  initial: BusinessDetails | null;
  onSubmit: (business: BusinessDetails) => Promise<void> | void;
  onBack: () => void;
}

function findCountryByCode(code: string): Country | null {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

function isValidIsoDate(d: DateOfBirth): boolean {
  if (!d.day || !d.month || !d.year) return false;
  const day = Number(d.day);
  const month = Number(d.month);
  const year = Number(d.year);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
}

export default function BusinessDetailsStep({
  initial,
  onSubmit,
  onBack,
}: BusinessDetailsStepProps) {
  const [data, setData] = useState<BusinessDetails>(initial ?? emptyBusinessDetails());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const registrationCountry = findCountryByCode(data.registrationCountryCode);
  const addressCountry = findCountryByCode(data.address.countryCode);

  const update = <K extends keyof BusinessDetails>(key: K, value: BusinessDetails[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddress = <K extends keyof BusinessDetails["address"]>(
    key: K,
    value: BusinessDetails["address"][K],
  ) => {
    setData((prev) => ({ ...prev, address: { ...prev.address, [key]: value } }));
  };

  const updateIncorporationDate = (patch: Partial<DateOfBirth>) => {
    setData((prev) => ({
      ...prev,
      incorporationDate: { ...prev.incorporationDate, ...patch },
    }));
  };

  const updateStakeholder = (id: string, patch: Partial<Stakeholder>) => {
    setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const updateStakeholderDob = (id: string, patch: Partial<DateOfBirth>) => {
    setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) =>
        s.id === id ? { ...s, dateOfBirth: { ...s.dateOfBirth, ...patch } } : s,
      ),
    }));
  };

  const toggleRelationship = (id: string, type: NoahRelationshipType) => {
    setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) => {
        if (s.id !== id) return s;
        const has = s.relationshipTypes.includes(type);
        const next = has
          ? s.relationshipTypes.filter((t) => t !== type)
          : [...s.relationshipTypes, type];
        return { ...s, relationshipTypes: next };
      }),
    }));
  };

  const addStakeholder = () => {
    setData((prev) => ({ ...prev, stakeholders: [...prev.stakeholders, emptyStakeholder()] }));
  };

  const removeStakeholder = (id: string) => {
    setData((prev) => ({
      ...prev,
      stakeholders:
        prev.stakeholders.length > 1
          ? prev.stakeholders.filter((s) => s.id !== id)
          : prev.stakeholders,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!data.legalName.trim()) return setError("Company name is required.");
    if (!data.registrationCountryCode) return setError("Registration country is required.");
    if (!data.registrationNumber.trim()) return setError("Registration number is required.");
    if (!data.entityType) return setError("Entity type is required.");
    if (!isValidIsoDate(data.incorporationDate))
      return setError("Incorporation date is required.");

    if (!data.address.line1.trim()) return setError("Street address is required.");
    if (!data.address.city.trim()) return setError("City is required.");
    if (!data.address.postalCode.trim()) return setError("Postcode is required.");
    if (!data.address.countryCode) return setError("Address country is required.");

    if (data.stakeholders.length === 0) {
      return setError("Add at least one associate.");
    }

    for (const s of data.stakeholders) {
      const who = `${s.firstName} ${s.lastName}`.trim() || "associate";
      if (!s.firstName.trim()) return setError("First name is required for each associate.");
      if (!s.lastName.trim()) return setError("Last name is required for each associate.");
      if (s.relationshipTypes.length === 0)
        return setError(`Pick at least one role for ${who}.`);
      if (!isValidIsoDate(s.dateOfBirth))
        return setError(`Date of birth is required for ${who}.`);
    }

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save business details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="businessDetailsForm"
      onSubmit={handleSubmit}
      className="space-y-4 sm:space-y-6 pb-24 sm:pb-0"
      noValidate
    >
      {error ? (
        <div
          role="alert"
          className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-sm px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      ) : null}

      <div>
        <SectionTitle>Company</SectionTitle>
        <div className="space-y-2.5">
          <div>
            <label htmlFor="legalName" className={labelClass}>Company name</label>
            <input
              id="legalName"
              type="text"
              value={data.legalName}
              onChange={(e) => update("legalName", e.target.value)}
              placeholder="Example Corp"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label htmlFor="registrationCountry" className={labelClass}>Reg. country</label>
              <CountrySelect
                id="registrationCountry"
                value={registrationCountry?.code ?? null}
                onChange={(c) => update("registrationCountryCode", c.code)}
                placeholder="Select"
                tone="soft"
                ariaLabel="Registration country"
              />
            </div>
            <div>
              <label htmlFor="registrationNumber" className={labelClass}>Reg. number</label>
              <input
                id="registrationNumber"
                type="text"
                value={data.registrationNumber}
                onChange={(e) => update("registrationNumber", e.target.value)}
                placeholder="12345678"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label htmlFor="entityType" className={labelClass}>Entity type</label>
              <NativeSelect
                id="entityType"
                value={data.entityType}
                onChange={(v) => update("entityType", v as NoahEntityType)}
                ariaLabel="Entity type"
              >
                <option value="">Select</option>
                {ENTITY_TYPE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <label htmlFor="taxId" className={labelClass}>
                Tax ID <span className="font-normal text-gray-400">(Opt.)</span>
              </label>
              <input
                id="taxId"
                type="text"
                value={data.taxId}
                onChange={(e) => update("taxId", e.target.value)}
                placeholder="12-3456789"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Incorporation date</label>
            <DateGroup
              value={data.incorporationDate}
              onChange={updateIncorporationDate}
              ariaPrefix="Incorporation"
              yearStart={currentYear}
              yearEnd={currentYear - 100}
            />
          </div>

          <div>
            <label htmlFor="websiteUrl" className={labelClass}>
              Website <span className="font-normal text-gray-400">(Optional)</span>
            </label>
            <input
              id="websiteUrl"
              type="url"
              value={data.websiteUrl}
              onChange={(e) => update("websiteUrl", e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>Legal address</SectionTitle>
        <div className="space-y-2.5">
          <div>
            <label htmlFor="addr-line1" className={labelClass}>Street</label>
            <input
              id="addr-line1"
              type="text"
              value={data.address.line1}
              onChange={(e) => updateAddress("line1", e.target.value)}
              placeholder="123 Main St"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label htmlFor="addr-city" className={labelClass}>City</label>
              <input
                id="addr-city"
                type="text"
                value={data.address.city}
                onChange={(e) => updateAddress("city", e.target.value)}
                placeholder="Nairobi"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="addr-state" className={labelClass}>
                State <span className="font-normal text-gray-400">(Opt.)</span>
              </label>
              <input
                id="addr-state"
                type="text"
                value={data.address.state}
                onChange={(e) => updateAddress("state", e.target.value)}
                placeholder="Nairobi"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label htmlFor="addr-postal" className={labelClass}>Postcode</label>
              <input
                id="addr-postal"
                type="text"
                value={data.address.postalCode}
                onChange={(e) => updateAddress("postalCode", e.target.value)}
                placeholder="00100"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="addr-country" className={labelClass}>Country</label>
              <CountrySelect
                id="addr-country"
                value={addressCountry?.code ?? null}
                onChange={(c) => updateAddress("countryCode", c.code)}
                placeholder="Select"
                tone="soft"
                ariaLabel="Address country"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle>Associates</SectionTitle>
          <button
            type="button"
            onClick={addStakeholder}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-600"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        <div className="space-y-2.5">
          {data.stakeholders.map((s, idx) => (
            <div
              key={s.id}
              className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  #{idx + 1}
                </span>
                {data.stakeholders.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeStakeholder(s.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className={labelClass}>First name</label>
                  <input
                    type="text"
                    value={s.firstName}
                    onChange={(e) => updateStakeholder(s.id, { firstName: e.target.value })}
                    placeholder="John"
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Last name</label>
                  <input
                    type="text"
                    value={s.lastName}
                    onChange={(e) => updateStakeholder(s.id, { lastName: e.target.value })}
                    placeholder="Doe"
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Date of birth</label>
                <DateGroup
                  value={s.dateOfBirth}
                  onChange={(patch) => updateStakeholderDob(s.id, patch)}
                  ariaPrefix={`Associate ${idx + 1} DOB`}
                  yearStart={currentYear - 18}
                  yearEnd={currentYear - 100}
                />
              </div>

              <div>
                <label className={labelClass}>Roles</label>
                <div className="flex flex-wrap gap-1.5">
                  {RELATIONSHIP_OPTIONS.map((opt) => {
                    const checked = s.relationshipTypes.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleRelationship(s.id, opt.value)}
                        className={`px-2.5 h-7 rounded-full text-[11px] font-medium border transition-colors ${
                          checked
                            ? "border-primary-500 bg-primary-500 text-white"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/40 text-gray-600 dark:text-gray-300 hover:border-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden sm:flex sm:items-center sm:justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold h-11 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3"
      >
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/70"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="submit"
          form="businessDetailsForm"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white font-semibold h-11 rounded-lg transition-all disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
