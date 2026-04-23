"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { countries, paymentMethodsByCountry, type Country, type SavedRecipient } from "@/components/payments/paymentData";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { validateKenyanPhoneNumber } from "@/lib/phoneValidation";

const MPESA_METHODS = new Set(["M-Pesa Mobile Money", "M-Pesa Paybill"]);

const recipientSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    country: z.enum(countries, { message: "Select a country" }),
    paymentMethod: z.string().min(1, "Select a payment method"),
    phoneNumber: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.country === "Kenya" && MPESA_METHODS.has(value.paymentMethod)) {
      const res = validateKenyanPhoneNumber(value.phoneNumber ?? "");
      if (!res.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phoneNumber"],
          message: res.error ?? "Invalid phone number",
        });
      }
    }
  });

export type RecipientFormValues = z.infer<typeof recipientSchema>;

type RecipientFormProps = {
  initialValues?: Partial<RecipientFormValues>;
  selectedRecipient?: SavedRecipient | null;
  onSubmit: (values: RecipientFormValues) => void;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-xs text-[#E35D5B]">{message}</p> : null;
}

export default function RecipientForm({ initialValues, selectedRecipient, onSubmit }: RecipientFormProps) {
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
      country: initialValues?.country,
      paymentMethod: initialValues?.paymentMethod ?? "",
      phoneNumber: initialValues?.phoneNumber ?? "",
    },
  });

  const selectedCountry = useWatch({ control, name: "country" });
  const selectedMethod = useWatch({ control, name: "paymentMethod" });
  const methods = selectedCountry ? paymentMethodsByCountry[selectedCountry as Country] : [];
  const needsKenyanPhone =
    selectedCountry === "Kenya" && MPESA_METHODS.has(selectedMethod);

  useEffect(() => {
    if (!selectedRecipient) return;
    setValue("email", selectedRecipient.email, { shouldValidate: true });
    setValue("country", selectedRecipient.country, { shouldValidate: true });
    setValue("paymentMethod", selectedRecipient.paymentMethod, { shouldValidate: true });
    setValue("phoneNumber", selectedRecipient.phoneNumber ?? "", { shouldValidate: true });
  }, [selectedRecipient, setValue]);

  useEffect(() => {
    if (!selectedCountry) return;
    const availableMethods = paymentMethodsByCountry[selectedCountry as Country];
    const currentMethod = getValues("paymentMethod");
    if (currentMethod && !availableMethods.includes(currentMethod)) {
      setValue("paymentMethod", "", { shouldValidate: true });
    }
  }, [selectedCountry, setValue, getValues]);

  return (
    <div className={cardClassName("p-4 sm:p-5")}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">Recipient&apos;s email address</label>
          <input
            {...register("email")}
            placeholder="Enter email address"
            className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">Recipient&apos;s country</label>
          <div className="relative">
            <select
              {...register("country")}
              className="h-12 w-full appearance-none rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
              defaultValue={initialValues?.country ?? ""}
            >
              <option value="">Select the country of the recipient</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3B6]" />
          </div>
          <FieldError message={errors.country?.message} />
        </div>

        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">How would you like to pay this recipient?</label>
          <div className="relative">
            <select
              {...register("paymentMethod")}
              className="h-12 w-full appearance-none rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
              defaultValue={initialValues?.paymentMethod ?? ""}
            >
              <option value="">Select a payment method</option>
              {methods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3B6]" />
          </div>
          <FieldError message={errors.paymentMethod?.message} />
        </div>

        {needsKenyanPhone ? (
          <div>
            <label className="mb-2 block text-xs text-[#4D556D]">
              Recipient&apos;s phone number (Safaricom)
            </label>
            <div className="flex items-stretch gap-2">
              <div className="inline-flex items-center rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-3 text-sm font-medium text-[#4D556D]">
                🇰🇪 +254
              </div>
              <input
                {...register("phoneNumber", {
                  setValueAs: (raw: string) => {
                    const digits = (raw ?? "").replace(/\D/g, "");
                    if (!digits) return "";
                    if (digits.startsWith("254")) return digits;
                    if (digits.startsWith("0")) return `254${digits.slice(1)}`;
                    return `254${digits}`;
                  },
                })}
                inputMode="tel"
                placeholder="7XX XXX XXX"
                className="h-12 flex-1 rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
              />
            </div>
            <FieldError message={errors.phoneNumber?.message} />
          </div>
        ) : null}

        {methods.length > 0 && !needsKenyanPhone ? (
          <div className="rounded-xl border border-[#F0F2F7] bg-[#FAFBFE] px-4 py-3 text-sm text-[#2A3150]">
            <ul className="space-y-2">
              {methods.map((method) => (
                <li key={method}>{method}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!isValid}
          className="h-12 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          Proceed to payment amount
        </button>
      </form>
    </div>
  );
}
