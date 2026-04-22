"use client";

import { Building2, ChevronDown, Hash, Smartphone } from "lucide-react";
import type { DepositCardDetails, DepositCurrency, DepositPaymentMethod } from "@/stores/depositStore";
import MpesaMobileForm from "./MpesaMobileForm";
import MpesaPaybillDetails from "./MpesaPaybillDetails";
import BankTransferForm from "./BankTransferForm";

type PaymentMethodSelectorProps = {
  currency: Exclude<DepositCurrency, null>;
  selected: DepositPaymentMethod;
  onSelect: (method: Exclude<DepositPaymentMethod, null>) => void;
  phoneNumber: string;
  onPhoneChange: (val: string) => void;
  savePhone: boolean;
  onSavePhoneChange: (val: boolean) => void;
  cardDetails: DepositCardDetails;
  onCardDetailsChange: (partial: Partial<DepositCardDetails>) => void;
};

const PAYBILL_BUSINESS_NO = process.env.NEXT_PUBLIC_PAYBILL_BUSINESS_NO || "522522";
const PAYBILL_ACCOUNT_NO = process.env.NEXT_PUBLIC_PAYBILL_ACCOUNT_NO || "ELEMENTPAY";

export default function PaymentMethodSelector({
  currency,
  selected,
  onSelect,
  phoneNumber,
  onPhoneChange,
  savePhone,
  onSavePhoneChange,
  cardDetails,
  onCardDetailsChange,
}: PaymentMethodSelectorProps) {
  const showMobileMoney = currency === "KES";

  return (
    <div className="space-y-4">
      {showMobileMoney ? (
        <div>
          <p className="my-3 text-xs font-semibold uppercase tracking-wider text-[#8D92A6]">
            Mobile Money
          </p>
          <div className="space-y-2.5">
            <AccordionItem
              icon={<Smartphone className="h-4 w-4" />}
              title="M-Pesa mobile money"
              description="Receive an STK push and complete with your M-Pesa PIN"
              selected={selected === "mpesa-mobile"}
              onSelect={() => onSelect("mpesa-mobile")}
            >
              <MpesaMobileForm
                phoneNumber={phoneNumber}
                onPhoneChange={onPhoneChange}
                savePhone={savePhone}
                onSavePhoneChange={onSavePhoneChange}
              />
            </AccordionItem>
            <AccordionItem
              icon={<Hash className="h-4 w-4" />}
              title="M-Pesa Paybill"
              description="Pay from your phone via Paybill and confirm here"
              selected={selected === "mpesa-paybill"}
              onSelect={() => onSelect("mpesa-paybill")}
            >
              <MpesaPaybillDetails businessNo={PAYBILL_BUSINESS_NO} accountNo={PAYBILL_ACCOUNT_NO} />
            </AccordionItem>
          </div>
        </div>
      ) : null}

      <div>
        <p className="my-3 text-xs font-semibold uppercase tracking-wider text-[#8D92A6]">
          Bank Transfer
        </p>
        <div className="space-y-2.5">
          <AccordionItem
            icon={<Building2 className="h-4 w-4" />}
            title="Bank transfer"
            description="Deposit using your debit or credit card"
            selected={selected === "bank-transfer"}
            onSelect={() => onSelect("bank-transfer")}
          >
            <BankTransferForm details={cardDetails} onChange={onCardDetailsChange} />
          </AccordionItem>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({
  icon,
  title,
  description,
  selected,
  onSelect,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border transition ${
        selected ? "border-primary-300 bg-white shadow-sm" : "border-[#ECEEF4] bg-[#FAFBFE]"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? "border-primary-500 bg-primary-500" : "border-[#D1D5E0] bg-white"
          }`}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
        </span>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            selected ? "bg-primary-100 text-primary-600" : "bg-white text-[#7E8498]"
          }`}
        >
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#1A2138]">{title}</span>
          <span className="block text-xs text-[#7E8498]">{description}</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#7E8498] transition-transform ${selected ? "rotate-180" : ""}`}
        />
      </button>
      {selected ? (
        <div className="border-t border-[#ECEEF4] px-4 py-4">{children}</div>
      ) : null}
    </div>
  );
}
