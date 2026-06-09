"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import CountrySelect from "@/components/auth/CountrySelect";
import OnboardingStepper, {
  ONBOARDING_STEPS,
  type OnboardingStep,
} from "@/components/onboarding/OnboardingStepper";
import StateSelect from "@/components/onboarding/StateSelect";
import DatePicker from "@/components/ui/DatePicker";
import Select, { type SelectOption } from "@/components/ui/Select";
import { COUNTRIES, type Country } from "@/lib/countries";
import {
  emptyBusinessDetails,
  emptyStakeholder,
  type AnnualRevenueRange,
  type AssociateRelationshipType,
  type BusinessAddress,
  type BusinessDetails,
  type BusinessType,
  type EstimatedEmployees,
  type EstimatedMonthlyTurnover,
  type EstimatedTransactionValue,
  type IdType,
  type MonthlyTransactionFrequency,
  type OwnershipType,
  type SourceOfFunds,
  type Stakeholder,
  type StakeholderIdentity,
} from "@/lib/onboarding/types";

const ENTITY_TYPE_OPTIONS: SelectOption[] = [
  { value: "SoleTrader", label: "Sole Trader" },
  { value: "LimitedCompany", label: "Limited Company" },
  { value: "LimitedLiabilityCompany", label: "Limited Liability Company" },
  { value: "Partnership", label: "Partnership" },
  { value: "NonProfit", label: "Non-Profit" },
  { value: "Other", label: "Other" },
];

const EMPLOYEE_OPTIONS: SelectOption[] = [
  { value: "1-10", label: "1-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-1000", label: "201-1,000" },
  { value: "1000+", label: "1,000+" },
];

const REVENUE_OPTIONS: SelectOption[] = [
  { value: "LessThan100k", label: "< $100k" },
  { value: "100kTo1M", label: "$100k - $1M" },
  { value: "1MTo10M", label: "$1M - $10M" },
  { value: "MoreThan10M", label: "> $10M" },
];

const SOURCE_OF_FUNDS_OPTIONS: SelectOption[] = [
  { value: "Revenue", label: "Revenue" },
  { value: "Investment", label: "Investment" },
  { value: "Loans", label: "Loans" },
  { value: "Grants", label: "Grants" },
  { value: "Other", label: "Other" },
];

const OWNERSHIP_OPTIONS: SelectOption[] = [
  { value: "Private", label: "Private" },
  { value: "Public", label: "Public" },
  { value: "Government", label: "Government" },
  { value: "NonProfit", label: "Non-Profit" },
];

const TURNOVER_OPTIONS: SelectOption[] = [
  { value: "UpTo10k", label: "Up to $10k" },
  { value: "UpTo50k", label: "Up to $50k" },
  { value: "UpTo100k", label: "Up to $100k" },
  { value: "UpTo500k", label: "Up to $500k" },
  { value: "Over500k", label: "Over $500k" },
];

const TXN_VALUE_OPTIONS: SelectOption[] = [
  { value: "UpTo10k", label: "Up to $10k" },
  { value: "UpTo50k", label: "Up to $50k" },
  { value: "UpTo100k", label: "Up to $100k" },
  { value: "UpTo500k", label: "Up to $500k" },
  { value: "Over500k", label: "Over $500k" },
];

const TXN_FREQ_OPTIONS: SelectOption[] = [
  { value: "UpTo5", label: "Up to 5" },
  { value: "UpTo20", label: "Up to 20" },
  { value: "UpTo50", label: "Up to 50" },
  { value: "UpTo200", label: "Up to 200" },
  { value: "Over200", label: "Over 200" },
];

const ID_TYPE_OPTIONS: SelectOption[] = [
  { value: "NationalIDCard", label: "National ID" },
  { value: "Passport", label: "Passport" },
  { value: "DrivingLicense", label: "Driving License" },
  { value: "ResidencePermit", label: "Residence Permit" },
];

const RELATIONSHIP_OPTIONS: { value: AssociateRelationshipType; label: string }[] = [
  { value: "Representative", label: "Representative" },
  { value: "Director", label: "Director" },
  { value: "Shareholder", label: "Shareholder" },
  { value: "UBO", label: "UBO" },
];

const inputClass =
  "w-full h-10 px-3 rounded-lg border-0 bg-gray-100 dark:bg-gray-800/70 text-gray-900 dark:text-white text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/25";

const labelClass =
  "block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5";

const WIZARD_STEP_KEYS = ONBOARDING_STEPS.map((step) => step.key);
const VALIDATION_STEPS: OnboardingStep[] = [
  "identity",
  "activity",
  "address",
  "associates",
];

interface BusinessDetailsStepProps {
  initial: BusinessDetails | null;
  onSubmit: (business: BusinessDetails) => Promise<void> | void;
  onDraftChange?: (business: BusinessDetails) => void;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </h3>
  );
}

function findCountryByCode(code: string): Country | null {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

function optionLabel(options: SelectOption[], value: string): string {
  return options.find((opt) => opt.value === value)?.label ?? value;
}

function countryLabel(code: string): string {
  return findCountryByCode(code)?.name ?? code;
}

function displayValue(value: string | undefined | null): string {
  return value && value.trim() ? value : "Not provided";
}

function addressLabel(address: BusinessAddress): string {
  return [
    address.line1,
    address.city,
    address.state,
    address.postalCode,
    countryLabel(address.countryCode),
  ]
    .filter(Boolean)
    .join(", ");
}

function mergeStakeholder(stakeholder: Stakeholder): Stakeholder {
  const defaults = emptyStakeholder();
  return {
    ...defaults,
    ...stakeholder,
    relationshipTypes:
      stakeholder.relationshipTypes?.length > 0
        ? stakeholder.relationshipTypes
        : defaults.relationshipTypes,
    residentialAddress: {
      ...defaults.residentialAddress,
      ...stakeholder.residentialAddress,
    },
    identity: {
      ...defaults.identity,
      ...stakeholder.identity,
    },
  };
}

function normalizeInitialBusiness(initial: BusinessDetails | null): BusinessDetails {
  const defaults = emptyBusinessDetails();
  if (!initial) return defaults;
  return {
    ...defaults,
    ...initial,
    address: {
      ...defaults.address,
      ...initial.address,
    },
    stakeholders:
      initial.stakeholders?.length > 0
        ? initial.stakeholders.map(mergeStakeholder)
        : defaults.stakeholders,
  };
}

function isAddressValid(address: BusinessAddress): boolean {
  return Boolean(
    address.line1.trim() &&
      address.city.trim() &&
      address.postalCode.trim() &&
      address.countryCode,
  );
}

function validateStep(step: OnboardingStep, data: BusinessDetails): string | null {
  if (step === "identity") {
    if (!data.legalName.trim()) return "Company name is required.";
    if (!data.registrationCountryCode) return "Registration country is required.";
    if (!data.entityType) return "Entity type is required.";
    if (!data.incorporationDate) return "Incorporation date is required.";
    if (!data.industry.trim()) return "Industry is required.";
    return null;
  }

  if (step === "activity") {
    if (!data.ownershipType) return "Ownership type is required.";
    if (!data.estimatedEmployees) return "Employee count is required.";
    if (!data.annualRevenueRange) return "Annual revenue range is required.";
    if (!data.sourceOfFunds) return "Source of funds is required.";
    if (!data.estimatedMonthlyTurnover) return "Monthly turnover is required.";
    if (!data.estimatedTransactionValue) return "Transaction value is required.";
    if (!data.monthlyTransactionFrequency) {
      return "Transaction frequency is required.";
    }
    return null;
  }

  if (step === "address") {
    return isAddressValid(data.address) ? null : "Complete the registered address.";
  }

  if (step === "associates") {
    if (data.stakeholders.length === 0) return "Add at least one associate.";

    for (const stakeholder of data.stakeholders) {
      const who =
        `${stakeholder.firstName} ${stakeholder.lastName}`.trim() || "associate";
      if (!stakeholder.firstName.trim()) {
        return "First name is required for each associate.";
      }
      if (!stakeholder.lastName.trim()) {
        return "Last name is required for each associate.";
      }
      if (stakeholder.relationshipTypes.length === 0) {
        return `Pick at least one role for ${who}.`;
      }
      if (!stakeholder.dateOfBirth) return `Date of birth is required for ${who}.`;
      if (!stakeholder.email.trim()) return `Email is required for ${who}.`;
      if (!stakeholder.phoneNumber.trim()) return `Phone is required for ${who}.`;
      if (!stakeholder.taxResidenceCountryCode) {
        return `Tax residence country is required for ${who}.`;
      }
      if (!isAddressValid(stakeholder.residentialAddress)) {
        return `Complete the residential address for ${who}.`;
      }
      if (!stakeholder.identity.idType) return `Pick an ID type for ${who}.`;
      if (!stakeholder.identity.idNumber.trim()) {
        return `ID number is required for ${who}.`;
      }
      if (!stakeholder.identity.issuingCountryCode) {
        return `Issuing country is required for ${who}.`;
      }
    }
  }

  return null;
}

function AddressFields({
  value,
  onChange,
  idPrefix,
}: {
  value: BusinessAddress;
  onChange: (patch: Partial<BusinessAddress>) => void;
  idPrefix: string;
}) {
  const country = findCountryByCode(value.countryCode);
  return (
    <div className="space-y-2.5">
      <div>
        <label htmlFor={`${idPrefix}-line1`} className={labelClass}>
          Street
        </label>
        <input
          id={`${idPrefix}-line1`}
          type="text"
          value={value.line1}
          onChange={(e) => onChange({ line1: e.target.value })}
          placeholder="123 Main St"
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <div>
          <label htmlFor={`${idPrefix}-country`} className={labelClass}>
            Country
          </label>
          <CountrySelect
            id={`${idPrefix}-country`}
            value={country?.code ?? null}
            onChange={(c) => onChange({ countryCode: c.code, state: "" })}
            placeholder="Select"
            tone="soft"
            ariaLabel="Country"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-city`} className={labelClass}>
            City
          </label>
          <input
            id={`${idPrefix}-city`}
            type="text"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="Nairobi"
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <div>
          <label htmlFor={`${idPrefix}-state`} className={labelClass}>
            State / Region
          </label>
          <StateSelect
            id={`${idPrefix}-state`}
            countryCode={value.countryCode || null}
            value={value.state}
            onChange={(state) => onChange({ state })}
            placeholder="Select"
            tone="soft"
            ariaLabel="State or region"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-postal`} className={labelClass}>
            Postcode
          </label>
          <input
            id={`${idPrefix}-postal`}
            type="text"
            value={value.postalCode}
            onChange={(e) => onChange({ postalCode: e.target.value })}
            placeholder="00100"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
      <div className="mb-2 flex items-center justify-between gap-3">
        <SectionTitle>{title}</SectionTitle>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-600"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
      <div className="space-y-1.5">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-xs sm:grid-cols-[160px_1fr]">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="min-w-0 font-medium text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

export default function BusinessDetailsStep({
  initial,
  onSubmit,
  onDraftChange,
}: BusinessDetailsStepProps) {
  const [data, setData] = useState<BusinessDetails>(() =>
    normalizeInitialBusiness(initial),
  );
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("identity");
  const [furthestStepIndex, setFurthestStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentStepIndex = WIZARD_STEP_KEYS.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStep === "review";
  const registrationCountry = findCountryByCode(data.registrationCountryCode);
  const furthestStep = WIZARD_STEP_KEYS[furthestStepIndex] ?? currentStep;

  useEffect(() => {
    onDraftChange?.(data);
  }, [data, onDraftChange]);

  const update = <K extends keyof BusinessDetails>(
    key: K,
    value: BusinessDetails[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (patch: Partial<BusinessAddress>) => {
    setData((prev) => ({ ...prev, address: { ...prev.address, ...patch } }));
  };

  const updateStakeholder = (id: string, patch: Partial<Stakeholder>) => {
    setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    }));
  };

  const updateStakeholderAddress = (
    id: string,
    patch: Partial<BusinessAddress>,
  ) => {
    setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) =>
        s.id === id
          ? { ...s, residentialAddress: { ...s.residentialAddress, ...patch } }
          : s,
      ),
    }));
  };

  const updateStakeholderIdentity = (
    id: string,
    patch: Partial<StakeholderIdentity>,
  ) => {
    setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) =>
        s.id === id ? { ...s, identity: { ...s.identity, ...patch } } : s,
      ),
    }));
  };

  const toggleRelationship = (id: string, type: AssociateRelationshipType) => {
    setData((prev) => ({
      ...prev,
      stakeholders: prev.stakeholders.map((s) => {
        if (s.id !== id) return s;
        const hasType = s.relationshipTypes.includes(type);
        return {
          ...s,
          relationshipTypes: hasType
            ? s.relationshipTypes.filter((t) => t !== type)
            : [...s.relationshipTypes, type],
        };
      }),
    }));
  };

  const addStakeholder = () => {
    setData((prev) => ({
      ...prev,
      stakeholders: [...prev.stakeholders, emptyStakeholder()],
    }));
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

  const goToStep = (step: OnboardingStep) => {
    setError("");
    setCurrentStep(step);
  };

  const handleStepChange = (step: OnboardingStep) => {
    const targetIndex = WIZARD_STEP_KEYS.indexOf(step);
    if (targetIndex <= furthestStepIndex) goToStep(step);
  };

  const handleNext = () => {
    const stepError = validateStep(currentStep, data);
    if (stepError) {
      setError(stepError);
      return;
    }

    const nextStep = WIZARD_STEP_KEYS[currentStepIndex + 1];
    if (!nextStep) return;
    setFurthestStepIndex((prev) => Math.max(prev, currentStepIndex + 1));
    goToStep(nextStep);
  };

  const handleBack = () => {
    const previousStep = WIZARD_STEP_KEYS[currentStepIndex - 1];
    if (previousStep) goToStep(previousStep);
  };

  const findFirstValidationError = () => {
    for (const step of VALIDATION_STEPS) {
      const stepError = validateStep(step, data);
      if (stepError) return { step, stepError };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLastStep) {
      handleNext();
      return;
    }

    const validation = findFirstValidationError();
    if (validation) {
      setCurrentStep(validation.step);
      setError(validation.stepError);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save business details.");
    } finally {
      setSubmitting(false);
    }
  };

  const navigationButton = (
    <button
      type={isLastStep ? "submit" : "button"}
      onClick={isLastStep ? undefined : handleNext}
      disabled={submitting}
      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 text-sm font-semibold text-white transition-all hover:bg-primary-600 hover:shadow-lg hover:shadow-primary-500/25 disabled:cursor-not-allowed disabled:bg-primary-300 disabled:shadow-none sm:w-auto"
    >
      {submitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {isLastStep ? "Submit verification" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  );

  return (
    <form
      id="businessDetailsForm"
      onSubmit={handleSubmit}
      className="space-y-4 pb-24 sm:pb-0"
      noValidate
    >
      <OnboardingStepper
        current={currentStep}
        furthestStep={furthestStep}
        onStepChange={handleStepChange}
      />

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {currentStep === "identity" ? (
        <section className="space-y-3">
          <SectionTitle>Business identity</SectionTitle>
          <div>
            <label htmlFor="legalName" className={labelClass}>
              Company name
            </label>
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
              <label htmlFor="registrationCountry" className={labelClass}>
                Reg. country
              </label>
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
              <label htmlFor="entityType" className={labelClass}>
                Entity type
              </label>
              <Select
                id="entityType"
                value={data.entityType}
                onChange={(v) => update("entityType", v as BusinessType)}
                options={ENTITY_TYPE_OPTIONS}
                placeholder="Select"
                ariaLabel="Entity type"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className={labelClass}>Incorporation date</label>
              <DatePicker
                value={data.incorporationDate}
                onChange={(v) => update("incorporationDate", v)}
                placeholder="Pick a date"
                ariaLabel="Incorporation date"
                minYear={currentYear - 100}
                maxYear={currentYear}
              />
            </div>
            <div>
              <label htmlFor="industry" className={labelClass}>
                Industry
              </label>
              <input
                id="industry"
                type="text"
                value={data.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="e.g. Fintech"
                className={inputClass}
                required
              />
            </div>
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
        </section>
      ) : null}

      {currentStep === "activity" ? (
        <section className="space-y-3">
          <SectionTitle>Business activity</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className={labelClass}>Ownership</label>
              <Select
                value={data.ownershipType}
                onChange={(v) => update("ownershipType", v as OwnershipType)}
                options={OWNERSHIP_OPTIONS}
                placeholder="Select"
                ariaLabel="Ownership type"
              />
            </div>
            <div>
              <label className={labelClass}>Employees</label>
              <Select
                value={data.estimatedEmployees}
                onChange={(v) =>
                  update("estimatedEmployees", v as EstimatedEmployees)
                }
                options={EMPLOYEE_OPTIONS}
                placeholder="Select"
                ariaLabel="Estimated employees"
              />
            </div>
            <div>
              <label className={labelClass}>Annual revenue</label>
              <Select
                value={data.annualRevenueRange}
                onChange={(v) =>
                  update("annualRevenueRange", v as AnnualRevenueRange)
                }
                options={REVENUE_OPTIONS}
                placeholder="Select"
                ariaLabel="Annual revenue range"
              />
            </div>
            <div>
              <label className={labelClass}>Source of funds</label>
              <Select
                value={data.sourceOfFunds}
                onChange={(v) => update("sourceOfFunds", v as SourceOfFunds)}
                options={SOURCE_OF_FUNDS_OPTIONS}
                placeholder="Select"
                ariaLabel="Source of funds"
              />
            </div>
            <div>
              <label className={labelClass}>Monthly turnover</label>
              <Select
                value={data.estimatedMonthlyTurnover}
                onChange={(v) =>
                  update("estimatedMonthlyTurnover", v as EstimatedMonthlyTurnover)
                }
                options={TURNOVER_OPTIONS}
                placeholder="Select"
                ariaLabel="Estimated monthly turnover"
              />
            </div>
            <div>
              <label className={labelClass}>Txn value</label>
              <Select
                value={data.estimatedTransactionValue}
                onChange={(v) =>
                  update(
                    "estimatedTransactionValue",
                    v as EstimatedTransactionValue,
                  )
                }
                options={TXN_VALUE_OPTIONS}
                placeholder="Select"
                ariaLabel="Estimated transaction value"
              />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Txn frequency / mo</label>
              <Select
                value={data.monthlyTransactionFrequency}
                onChange={(v) =>
                  update(
                    "monthlyTransactionFrequency",
                    v as MonthlyTransactionFrequency,
                  )
                }
                options={TXN_FREQ_OPTIONS}
                placeholder="Select"
                ariaLabel="Monthly transaction frequency"
              />
            </div>
          </div>
        </section>
      ) : null}

      {currentStep === "address" ? (
        <section className="space-y-3">
          <SectionTitle>Registered address</SectionTitle>
          <AddressFields value={data.address} onChange={updateAddress} idPrefix="addr" />
        </section>
      ) : null}

      {currentStep === "associates" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <SectionTitle>Owners and directors</SectionTitle>
            <button
              type="button"
              onClick={addStakeholder}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-500 hover:text-primary-600"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>

          <div className="space-y-3">
            {data.stakeholders.map((stakeholder, idx) => (
              <div
                key={stakeholder.id}
                className="space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Associate #{idx + 1}
                  </span>
                  {data.stakeholders.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeStakeholder(stakeholder.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className={labelClass}>First name</label>
                    <input
                      type="text"
                      value={stakeholder.firstName}
                      onChange={(e) =>
                        updateStakeholder(stakeholder.id, {
                          firstName: e.target.value,
                        })
                      }
                      placeholder="John"
                      className={inputClass}
                      required
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Last name</label>
                    <input
                      type="text"
                      value={stakeholder.lastName}
                      onChange={(e) =>
                        updateStakeholder(stakeholder.id, {
                          lastName: e.target.value,
                        })
                      }
                      placeholder="Doe"
                      className={inputClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Date of birth</label>
                  <DatePicker
                    value={stakeholder.dateOfBirth}
                    onChange={(v) =>
                      updateStakeholder(stakeholder.id, { dateOfBirth: v })
                    }
                    placeholder="Pick a date"
                    ariaLabel={`Associate ${idx + 1} date of birth`}
                    minYear={currentYear - 100}
                    maxYear={currentYear - 18}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input
                      type="email"
                      value={stakeholder.email}
                      onChange={(e) =>
                        updateStakeholder(stakeholder.id, { email: e.target.value })
                      }
                      placeholder="name@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input
                      type="tel"
                      value={stakeholder.phoneNumber}
                      onChange={(e) =>
                        updateStakeholder(stakeholder.id, {
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="+254700000000"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Tax residence</label>
                  <CountrySelect
                    value={stakeholder.taxResidenceCountryCode || null}
                    onChange={(c) =>
                      updateStakeholder(stakeholder.id, {
                        taxResidenceCountryCode: c.code,
                      })
                    }
                    placeholder="Select"
                    tone="soft"
                    ariaLabel="Tax residence country"
                  />
                </div>

                <div>
                  <label className={labelClass}>Roles</label>
                  <div className="flex flex-wrap gap-1.5">
                    {RELATIONSHIP_OPTIONS.map((opt) => {
                      const checked = stakeholder.relationshipTypes.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            toggleRelationship(stakeholder.id, opt.value)
                          }
                          className={`h-7 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${
                            checked
                              ? "border-primary-500 bg-primary-500 text-white"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className={`${labelClass} !mb-1`}>Residential address</p>
                  <AddressFields
                    value={stakeholder.residentialAddress}
                    onChange={(patch) =>
                      updateStakeholderAddress(stakeholder.id, patch)
                    }
                    idPrefix={`assoc-${idx}-addr`}
                  />
                </div>

                <div>
                  <p className={`${labelClass} !mb-1`}>ID document</p>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                    <div>
                      <label className={labelClass}>Type</label>
                      <Select
                        value={stakeholder.identity.idType}
                        onChange={(v) =>
                          updateStakeholderIdentity(stakeholder.id, {
                            idType: v as IdType,
                          })
                        }
                        options={ID_TYPE_OPTIONS}
                        placeholder="Select"
                        ariaLabel="ID type"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Number</label>
                      <input
                        type="text"
                        value={stakeholder.identity.idNumber}
                        onChange={(e) =>
                          updateStakeholderIdentity(stakeholder.id, {
                            idNumber: e.target.value,
                          })
                        }
                        placeholder="ID #"
                        className={inputClass}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Issuing country</label>
                      <CountrySelect
                        value={stakeholder.identity.issuingCountryCode || null}
                        onChange={(c) =>
                          updateStakeholderIdentity(stakeholder.id, {
                            issuingCountryCode: c.code,
                          })
                        }
                        placeholder="Select"
                        tone="soft"
                        ariaLabel="Issuing country"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {currentStep === "review" ? (
        <section className="space-y-3">
          <ReviewSection title="Business" onEdit={() => goToStep("identity")}>
            <dl className="space-y-1.5">
              <SummaryRow label="Company" value={displayValue(data.legalName)} />
              <SummaryRow
                label="Country"
                value={countryLabel(data.registrationCountryCode)}
              />
              <SummaryRow
                label="Entity"
                value={optionLabel(ENTITY_TYPE_OPTIONS, data.entityType)}
              />
              <SummaryRow
                label="Incorporated"
                value={displayValue(data.incorporationDate)}
              />
              <SummaryRow label="Industry" value={displayValue(data.industry)} />
              <SummaryRow label="Website" value={displayValue(data.websiteUrl)} />
            </dl>
          </ReviewSection>

          <ReviewSection title="Activity" onEdit={() => goToStep("activity")}>
            <dl className="space-y-1.5">
              <SummaryRow
                label="Ownership"
                value={optionLabel(OWNERSHIP_OPTIONS, data.ownershipType)}
              />
              <SummaryRow
                label="Employees"
                value={optionLabel(EMPLOYEE_OPTIONS, data.estimatedEmployees)}
              />
              <SummaryRow
                label="Revenue"
                value={optionLabel(REVENUE_OPTIONS, data.annualRevenueRange)}
              />
              <SummaryRow
                label="Funds"
                value={optionLabel(SOURCE_OF_FUNDS_OPTIONS, data.sourceOfFunds)}
              />
              <SummaryRow
                label="Monthly volume"
                value={optionLabel(TURNOVER_OPTIONS, data.estimatedMonthlyTurnover)}
              />
              <SummaryRow
                label="Txn value"
                value={optionLabel(TXN_VALUE_OPTIONS, data.estimatedTransactionValue)}
              />
              <SummaryRow
                label="Txn frequency"
                value={optionLabel(TXN_FREQ_OPTIONS, data.monthlyTransactionFrequency)}
              />
            </dl>
          </ReviewSection>

          <ReviewSection title="Address" onEdit={() => goToStep("address")}>
            <dl>
              <SummaryRow label="Registered" value={addressLabel(data.address)} />
            </dl>
          </ReviewSection>

          <ReviewSection title="People" onEdit={() => goToStep("associates")}>
            <div className="space-y-3">
              {data.stakeholders.map((stakeholder, idx) => (
                <dl
                  key={stakeholder.id}
                  className="space-y-1.5 border-t border-gray-100 pt-2 first:border-t-0 first:pt-0 dark:border-gray-800"
                >
                  <SummaryRow
                    label={`Associate ${idx + 1}`}
                    value={displayValue(
                      `${stakeholder.firstName} ${stakeholder.lastName}`.trim(),
                    )}
                  />
                  <SummaryRow
                    label="Roles"
                    value={stakeholder.relationshipTypes.join(", ")}
                  />
                  <SummaryRow label="Email" value={displayValue(stakeholder.email)} />
                  <SummaryRow label="Phone" value={displayValue(stakeholder.phoneNumber)} />
                  <SummaryRow
                    label="Tax residence"
                    value={countryLabel(stakeholder.taxResidenceCountryCode)}
                  />
                  <SummaryRow
                    label="Residential"
                    value={addressLabel(stakeholder.residentialAddress)}
                  />
                  <SummaryRow
                    label="ID"
                    value={`${optionLabel(ID_TYPE_OPTIONS, stakeholder.identity.idType)} - ${displayValue(
                      stakeholder.identity.idNumber,
                    )}`}
                  />
                </dl>
              ))}
            </div>
          </ReviewSection>
        </section>
      ) : null}

      <div className="hidden items-center justify-between gap-3 pt-1 sm:flex">
        {isFirstStep ? (
          <span aria-hidden="true" />
        ) : (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {navigationButton}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur dark:border-gray-800 dark:bg-gray-950/95 sm:hidden">
        {isFirstStep ? null : (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 dark:bg-gray-800/70 dark:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        <div className="flex-1">{navigationButton}</div>
      </div>
    </form>
  );
}
