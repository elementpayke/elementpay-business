"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { countries, paymentMethodsByCountry, type Country, type SavedRecipient } from "@/components/payments/paymentData";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";

const recipientSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  country: z.enum(countries, { message: "Select a country" }),
  paymentMethod: z.string().min(1, "Select a payment method"),
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
    watch,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<RecipientFormValues>({
    resolver: zodResolver(recipientSchema),
    mode: "onChange",
    defaultValues: {
      email: initialValues?.email ?? "",
      country: initialValues?.country,
      paymentMethod: initialValues?.paymentMethod ?? "",
    },
  });

  const selectedCountry = watch("country");
  const methods = selectedCountry ? paymentMethodsByCountry[selectedCountry as Country] : [];

  useEffect(() => {
    if (!selectedRecipient) return;
    setValue("email", selectedRecipient.email, { shouldValidate: true });
    setValue("country", selectedRecipient.country, { shouldValidate: true });
    setValue("paymentMethod", selectedRecipient.paymentMethod, { shouldValidate: true });
  }, [selectedRecipient, setValue]);

  useEffect(() => {
    if (!selectedCountry) return;
    const availableMethods = paymentMethodsByCountry[selectedCountry as Country];
    const currentMethod = watch("paymentMethod");
    if (currentMethod && !availableMethods.includes(currentMethod)) {
      setValue("paymentMethod", "", { shouldValidate: true });
    }
  }, [selectedCountry, setValue, watch]);

  return (
    <div className={cardClassName("p-4 sm:p-5")}>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">Recipient's email address</label>
          <input
            {...register("email")}
            placeholder="Enter email address"
            className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div>
          <label className="mb-2 block text-xs text-[#4D556D]">Recipient's country</label>
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

        {methods.length > 0 ? (
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