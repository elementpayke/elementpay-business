"use client";

import { useEffect, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import {
  useCatalogDirection,
  type CatalogCountryOption,
  type CatalogMethodOption,
} from "@/lib/catalog/useCatalog";
import BankProviderSelect from "@/components/deposit/BankProviderSelect";

const recipientSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    countryCode: z.string().min(2, "Select a country"),
    /** A CatalogMethodOption `optionKey`: "mobile_money" | "bank" | "rail:<type>". */
    methodKey: z.string().min(1, "Select a payment method"),
    bankCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Every non-momo option (bank + offramp rails) is an account payout and
    // needs the bank/provider we'll offramp to selected up front.
    if (data.methodKey && data.methodKey !== "mobile_money") {
      if (!data.bankCode || data.bankCode.trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["bankCode"],
          message: "Select the bank to send to.",
        });
      }
    }
  });

export type RecipientFormValues = z.infer<typeof recipientSchema>;

/** What the parent step needs to persist into the send-payment store. */
export type RecipientSubmit = {
  email: string;
  countryCode: string;
  countryName: string;
  receiveCurrency: string;
  methodKey: "momo" | "bank";
  /** Exact catalog option chosen — lets us restore the picker on back-nav. */
  methodOptionKey: string;
  methodLabel: string;
  bankCode?: string;
  bankName?: string;
  /** Aggregator institution id (CatalogProvider.id) for the chosen bank —
   *  required by the OffRamp quote's `destination.networkId` for bank payouts. */
  bankNetworkId?: string;
};

type RecipientFormProps = {
  initialValues?: Partial<RecipientFormValues>;
  onSubmit: (values: RecipientSubmit) => void;
};

function FieldError({ message }: { message?: string }) {
  return message ? (
    <p className="mt-2 text-xs text-[#E35D5B]">{message}</p>
  ) : null;
}

export default function RecipientForm({ initialValues, onSubmit }: RecipientFormProps) {
  // Send Payment is an off-ramp (crypto → fiat payout), so corridors,
  // methods, providers and rails come from the offramp catalog payload.
  const { countries, getMethods, isLoading, error } = useCatalogDirection("offramp");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isValid },
  } = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientSchema),
    mode: "onChange",
    defaultValues: {
      email: initialValues?.email ?? "",
      countryCode: initialValues?.countryCode ?? "",
      methodKey: initialValues?.methodKey ?? "",
      bankCode: initialValues?.bankCode ?? "",
    },
  });

  const selectedCountryCode = useWatch({ control, name: "countryCode" });
  // Holds the selected option's `optionKey` (unique per country).
  const selectedOptionKey = useWatch({ control, name: "methodKey" });

  const selectedCountry = useMemo<CatalogCountryOption | null>(
    () => countries.find((c) => c.code === selectedCountryCode) ?? null,
    [countries, selectedCountryCode],
  );

  const methods = useMemo<CatalogMethodOption[]>(
    () => getMethods(selectedCountryCode || null),
    [getMethods, selectedCountryCode],
  );

  const selectedMethod = useMemo<CatalogMethodOption | null>(
    () => methods.find((m) => m.optionKey === selectedOptionKey) ?? null,
    [methods, selectedOptionKey],
  );

  // Drop a stale method when the country changes its available set.
  useEffect(() => {
    if (!selectedCountryCode) return;
    const current = getValues("methodKey");
    if (current && !methods.some((m) => m.optionKey === current)) {
      setValue("methodKey", "", { shouldValidate: true });
      setValue("bankCode", "", { shouldValidate: true });
    }
  }, [selectedCountryCode, methods, setValue, getValues]);

  const isMomo = selectedMethod?.key === "momo";

  function submit(values: RecipientFormValues) {
    const country = countries.find((c) => c.code === values.countryCode);
    const method = methods.find((m) => m.optionKey === values.methodKey);
    if (!country || !method) return;
    const bank = isMomo
      ? null
      : method.providers.find((p) => p.code === values.bankCode) ?? null;
    onSubmit({
      email: values.email,
      countryCode: country.code,
      countryName: country.name,
      receiveCurrency: country.currency,
      methodKey: method.key,
      methodOptionKey: method.optionKey,
      methodLabel: method.label,
      bankCode: isMomo ? undefined : values.bankCode?.trim() || undefined,
      bankName: bank?.name,
      bankNetworkId: bank?.id,
    });
  }

  return (
    <div className={cardClassName("p-4 sm:p-5")}>
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">
            Recipient&apos;s email address
          </label>
          <input
            {...register("email")}
            placeholder="Enter email address"
            className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">
            Recipient&apos;s country
          </label>
          <div className="relative">
            <select
              {...register("countryCode")}
              disabled={isLoading || !!error || countries.length === 0}
              className="h-12 w-full appearance-none rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white disabled:opacity-60"
            >
              <option value="">
                {error
                  ? "Couldn't load countries"
                  : isLoading
                    ? "Loading countries…"
                    : "Select the country of the recipient"}
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} ({country.currency})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3B6]" />
          </div>
          <FieldError message={errors.countryCode?.message} />
        </div>

        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">
            How would you like to pay this recipient?
          </label>
          <div className="relative">
            <select
              {...register("methodKey")}
              disabled={!selectedCountry || methods.length === 0}
              className="h-12 w-full appearance-none rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white disabled:opacity-60"
            >
              <option value="">Select a payment method</option>
              {methods.map((method) => (
                <option key={method.optionKey} value={method.optionKey}>
                  {method.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3B6]" />
          </div>
          <FieldError message={errors.methodKey?.message} />
        </div>

        {selectedMethod && !isMomo ? (
          selectedMethod.providers.length > 0 ? (
            <div>
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <BankProviderSelect
                    providers={selectedMethod.providers}
                    value={field.value ?? ""}
                    onChange={(code) => field.onChange(code)}
                  />
                )}
              />
              <FieldError message={errors.bankCode?.message} />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-xs text-[#4D556D]">
                Bank code (SWIFT/BIC or local)
              </label>
              <input
                {...register("bankCode")}
                placeholder="KCBLKENX"
                className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm uppercase text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
              />
              <FieldError message={errors.bankCode?.message} />
            </div>
          )
        ) : null}

        <button
          type="submit"
          disabled={!isValid}
          className="
            h-12 w-full rounded-xl
            bg-primary-500 text-sm font-semibold text-white
            transition hover:brightness-105
            disabled:cursor-not-allowed disabled:opacity-45
          "
        >
          Proceed to payment amount
        </button>
      </form>
    </div>
  );
}
