"use client";

import { useMemo, useState } from "react";
import {
  buildInvoiceIntakeFollowUpMessage,
  createEmptyInvoiceIntakeFields,
  validateInvoiceIntakeFields,
  type InvoiceIntakeDraft,
  type InvoiceIntakeFieldErrors,
  type InvoiceIntakeFields,
} from "@/lib/treasury/invoiceIntake";

type InvoiceIntakeCardProps = {
  draft: InvoiceIntakeDraft;
  disabled?: boolean;
  onSubmit: (message: string) => void;
};

type InvoiceIntakeFieldName = keyof InvoiceIntakeFields;

type IntakeFieldConfig = {
  name: InvoiceIntakeFieldName;
  label: string;
  placeholder: string;
  autoComplete: string;
  type?: "email" | "text";
};

export default function InvoiceIntakeCard({
  draft,
  disabled = false,
  onSubmit,
}: InvoiceIntakeCardProps) {
  const [fields, setFields] = useState<InvoiceIntakeFields>(() =>
    createEmptyInvoiceIntakeFields(),
  );
  const [errors, setErrors] = useState<InvoiceIntakeFieldErrors>({});

  const fieldConfigs = useMemo<IntakeFieldConfig[]>(
    () => [
      {
        name: "clientEmail",
        label: `${draft.clientName}'s email`,
        placeholder: `${draft.clientName}'s email`,
        autoComplete: "email",
        type: "email",
      },
      {
        name: "lineItemDescription",
        label: "Line item",
        placeholder: "Line item description",
        autoComplete: "off",
      },
      {
        name: "businessStreetAddress",
        label: "Street address",
        placeholder: "Your street address",
        autoComplete: "street-address",
      },
      {
        name: "businessCity",
        label: "City",
        placeholder: "Your city",
        autoComplete: "address-level2",
      },
      {
        name: "businessCountry",
        label: "Country",
        placeholder: "Your country",
        autoComplete: "country-name",
      },
      {
        name: "businessPostalCode",
        label: "ZIP / postal code",
        placeholder: "Your ZIP / postal code",
        autoComplete: "postal-code",
      },
    ],
    [draft.clientName],
  );

  function updateField(name: InvoiceIntakeFieldName, value: string) {
    setFields((currentFields) => ({
      ...currentFields,
      [name]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    const validation = validateInvoiceIntakeFields(fields, draft);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onSubmit(buildInvoiceIntakeFollowUpMessage(draft, fields));
  }

  return (
    <div className="mr-4 max-w-[560px] rounded-2xl border border-[#E6EAF2] bg-[#F8FAFE] p-4 text-sm text-[#1D243C] shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
      <div>
        <h3 className="text-sm font-semibold text-[#171D32]">
          Invoice details for {draft.clientName}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[#6B7286]">
          Amount: {draft.currency} {draft.amount}. Fill in the rest to draft the
          invoice.
        </p>
      </div>

      <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
        {fieldConfigs.map((field) => {
          const error = errors[field.name];
          const inputId = `invoice-intake-${field.name}`;
          const errorId = `${inputId}-error`;

          return (
            <div key={field.name}>
              <label
                htmlFor={inputId}
                className="mb-1.5 block text-xs font-medium text-[#4D556D]"
              >
                {field.label}
              </label>
              <input
                id={inputId}
                type={field.type ?? "text"}
                value={fields[field.name]}
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => updateField(field.name, event.target.value)}
                className={`h-12 w-full rounded-lg border bg-white px-3.5 text-sm text-[#1F2640] outline-none transition placeholder:text-[#9CA3B6] disabled:cursor-not-allowed disabled:bg-[#EEF1F7] disabled:text-[#8E93A7] ${
                  error
                    ? "border-[#E35D5B] focus:border-[#E35D5B] focus:ring-2 focus:ring-[#E35D5B]/20"
                    : "border-[#E1E4EE] focus:border-primary-300 focus:ring-2 focus:ring-primary-500/15"
                }`}
              />
              {error ? (
                <p id={errorId} className="mt-1.5 text-xs text-[#B23A4E]">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#B4B9CC] disabled:text-white disabled:hover:brightness-100"
        >
          Next
        </button>
      </form>
    </div>
  );
}
