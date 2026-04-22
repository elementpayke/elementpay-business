"use client";

import { useMemo } from "react";
import { CurrencySelect, SelectDropdown, TextField } from "@/components/invoices/formPrimitives";
import {
  paymentMethodsByCountry,
  receivingWallets,
  type CurrencyCode,
  type InvoicePaymentMethodRail,
} from "@/components/invoices/invoiceData";
import { useInvoiceStore } from "@/stores/invoiceStore";

export default function PaymentDetailsSection() {
  const draft = useInvoiceStore((s) => s.draft);
  const setDraft = useInvoiceStore((s) => s.setDraft);

  const clientCountry = draft.client.country;
  const availableMethods = useMemo(
    () => (clientCountry ? paymentMethodsByCountry[clientCountry] : []),
    [clientCountry],
  );

  const methodOptions = availableMethods.map((m) => ({ value: m.id, label: m.label }));
  const walletOptions = receivingWallets.map((w) => ({ value: w.id, label: w.label, description: w.currency }));

  const selectedMethod = availableMethods.find((m) => m.id === draft.preferredPaymentMethod);

  return (
    <section className="space-y-4">
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#1C2238]">Payment details</h2>

      <div className="grid gap-4 lg:grid-cols-3">
        <SelectDropdown
          label="Receiving wallet"
          value={draft.receivingWalletId}
          onChange={(val) => setDraft((d) => ({ ...d, receivingWalletId: val }))}
          options={walletOptions}
          placeholder="Select wallet"
        />
        <CurrencySelect
          label="Preferred payment currency"
          value={draft.preferredCurrency}
          onChange={(code: CurrencyCode) => setDraft((d) => ({ ...d, preferredCurrency: code }))}
        />
        <SelectDropdown
          label="Preferred payment method"
          value={draft.preferredPaymentMethod}
          onChange={(val) =>
            setDraft((d) => ({
              ...d,
              preferredPaymentMethod: val as InvoicePaymentMethodRail,
              paymentMethodFields: {},
            }))
          }
          options={methodOptions}
          disabled={!clientCountry || methodOptions.length === 0}
          placeholder={clientCountry ? "Select payment method" : "Pick client country first"}
        />
      </div>

      {selectedMethod ? (
        <div className="grid gap-4 rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] p-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedMethod.fields.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={draft.paymentMethodFields[field.key] ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  paymentMethodFields: { ...d.paymentMethodFields, [field.key]: e.target.value },
                }))
              }
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
