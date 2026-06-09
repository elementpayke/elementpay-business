"use client";

import { Building2, Check, ChevronDown, Smartphone } from "lucide-react";
import type { DepositPaymentMethod, DepositProvider } from "@/stores/depositStore";
import type { CatalogMethodOption } from "@/lib/catalog/useCatalog";
import type { CatalogProvider } from "@/lib/catalog/api";
import MpesaMobileForm from "./MpesaMobileForm";

type PaymentMethodSelectorProps = {
  /** Enabled methods for the selected corridor, from the catalog. */
  methods: CatalogMethodOption[];
  selectedMethod: DepositPaymentMethod;
  selectedProvider: DepositProvider;
  /** Selecting a provider also fixes the method group it belongs to. */
  onSelectProvider: (
    method: Exclude<DepositPaymentMethod, null>,
    provider: DepositProvider,
  ) => void;
  phoneNumber: string;
  onPhoneChange: (val: string) => void;
  accountName: string;
  onAccountNameChange: (val: string) => void;
};

export default function PaymentMethodSelector({
  methods,
  selectedMethod,
  selectedProvider,
  onSelectProvider,
  phoneNumber,
  onPhoneChange,
  accountName,
  onAccountNameChange,
}: PaymentMethodSelectorProps) {
  if (methods.length === 0) {
    return (
      <p className="rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 py-3 text-xs text-[#8E93A7]">
        No payment methods are available for this country yet.
      </p>
    );
  }

  function toProvider(
    method: CatalogMethodOption,
    p: CatalogProvider,
  ): DepositProvider {
    // Deposit is on-ramp only (no rails), so the method maps directly onto the
    // store's "mobile_money" | "bank" group.
    const groupKey = method.key === "momo" ? "mobile_money" : "bank";
    return { id: p.id, code: p.code, name: p.name, groupKey };
  }

  return (
    <div className="space-y-2.5">
      {methods.map((method) => {
        const isMomo = method.key === "momo";
        const methodActive = selectedMethod === method.key;
        return (
          <AccordionItem
            key={method.optionKey}
            icon={isMomo ? <Smartphone className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            title={method.label}
            description={
              isMomo
                ? "Pay us from your mobile money account."
                : "Pick your bank — we'll show the transfer details after you confirm the quote."
            }
            active={methodActive}
            onOpen={() => {
              // Opening a collapsed method selects its first provider so the
              // form/details surface without an extra click.
              if (!methodActive) {
                onSelectProvider(method.key, toProvider(method, method.providers[0]));
              }
            }}
          >
            <ProviderPicker
              providers={method.providers}
              selectedCode={methodActive ? selectedProvider?.code ?? null : null}
              onSelect={(p) => onSelectProvider(method.key, toProvider(method, p))}
            />

            {/* Bank pay-in: picking the receiving bank is all we capture here.
                The account/number/reference come from the accept-quote response
                and are shown on the success step. Only momo needs a form. */}
            {methodActive && selectedProvider && isMomo ? (
              <div className="mt-4">
                <MpesaMobileForm
                  phoneNumber={phoneNumber}
                  onPhoneChange={onPhoneChange}
                  accountName={accountName}
                  onAccountNameChange={onAccountNameChange}
                  providerName={selectedProvider.name}
                />
              </div>
            ) : null}
          </AccordionItem>
        );
      })}
    </div>
  );
}

/** Selectable tiles for the providers within one method. */
function ProviderPicker({
  providers,
  selectedCode,
  onSelect,
}: {
  providers: CatalogProvider[];
  selectedCode: string | null;
  onSelect: (provider: CatalogProvider) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {providers.map((p) => {
        const selected = p.code === selectedCode;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
              selected
                ? "border-primary-400 bg-primary-50 shadow-sm"
                : "border-[#ECEEF4] bg-white hover:border-[#D9DEEC]"
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                selected ? "border-primary-500 bg-primary-500" : "border-[#D1D5E0] bg-white"
              }`}
            >
              {selected ? <Check className="h-2.5 w-2.5 text-white" /> : null}
            </span>
            <span className="min-w-0 truncate text-sm font-medium text-[#1A2138]">
              {p.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AccordionItem({
  icon,
  title,
  description,
  active,
  onOpen,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  active: boolean;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border transition ${
        active ? "border-primary-300 bg-white shadow-sm" : "border-[#ECEEF4] bg-[#FAFBFE]"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            active ? "border-primary-500 bg-primary-500" : "border-[#D1D5E0] bg-white"
          }`}
        >
          {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            active ? "bg-primary-100 text-primary-600" : "bg-white text-[#7E8498]"
          }`}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#1A2138]">{title}</span>
          <span className="block text-xs text-[#7E8498]">{description}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#7E8498] transition-transform ${active ? "rotate-180" : ""}`}
        />
      </button>
      {active ? (
        <div className="border-t border-[#ECEEF4] px-4 py-4">{children}</div>
      ) : null}
    </div>
  );
}
