"use client";

import { useState } from "react";
import { CreditCard, Eye, EyeOff } from "lucide-react";
import type { DepositCardDetails } from "@/stores/depositStore";

type CardType = "visa" | "mastercard" | "amex" | "unknown";

type BankTransferFormProps = {
  details: DepositCardDetails;
  onChange: (partial: Partial<DepositCardDetails>) => void;
};

function detectCardType(digits: string): CardType {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "unknown";
}

function luhnCheck(digits: string): boolean {
  if (!/^\d+$/.test(digits) || digits.length < 12) return false;
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i]!, 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function isExpiryValid(mmyy: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(mmyy);
  if (!match) return false;
  const mm = parseInt(match[1]!, 10);
  const yy = parseInt(match[2]!, 10);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const currentYear = now.getFullYear() % 100;
  const currentMonth = now.getMonth() + 1;
  if (yy < currentYear) return false;
  if (yy === currentYear && mm < currentMonth) return false;
  return true;
}

function isCvvValid(cvv: string, cardType: CardType): boolean {
  const required = cardType === "amex" ? 4 : 3;
  return cvv.length === required && /^\d+$/.test(cvv);
}

function formatCardNumber(digits: string): string {
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export default function BankTransferForm({ details, onChange }: BankTransferFormProps) {
  const [showCvv, setShowCvv] = useState(false);

  const cardType = detectCardType(details.number);
  const numberDisplay = formatCardNumber(details.number);
  const luhnOk = details.number.length >= 12 && luhnCheck(details.number);
  const numberInvalid = details.number.length > 0 && !luhnOk && details.number.length >= 12;
  const expiryInvalid = details.expiry.length === 5 && !isExpiryValid(details.expiry);
  const cvvInvalid = details.cvv.length > 0 && !isCvvValid(details.cvv, cardType);
  const maxCvv = cardType === "amex" ? 4 : 3;

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">Cardholder name</label>
        <input
          type="text"
          autoComplete="cc-name"
          value={details.cardholder}
          onChange={(e) => onChange({ cardholder: e.target.value })}
          placeholder="Name on card"
          className="h-11 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-3.5 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">Card number</label>
        <div
          className={`flex items-center overflow-hidden rounded-lg border bg-[#FAFBFE] transition focus-within:bg-white ${
            numberInvalid ? "border-[#F5B5B3]" : luhnOk ? "border-tertiary-300" : "border-[#ECEEF4]"
          }`}
        >
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={numberDisplay}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, cardType === "amex" ? 15 : 19);
              onChange({ number: digits });
            }}
            className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-[#1F2640] outline-none placeholder:text-[#8E93A7]"
          />
          <div className="flex items-center pr-3 text-[11px] font-semibold uppercase text-[#7E8498]">
            {cardType === "unknown" ? (
              <CreditCard className="h-4 w-4" />
            ) : (
              <span>{cardType}</span>
            )}
          </div>
        </div>
        {numberInvalid ? (
          <p className="mt-1 text-xs text-[#E35D5B]">Invalid card number</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">Expiry (MM/YY)</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={details.expiry}
            onChange={(e) => {
              let v = e.target.value.replace(/\D/g, "").slice(0, 4);
              if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
              onChange({ expiry: v });
            }}
            className={`h-11 w-full rounded-lg border bg-[#FAFBFE] px-3.5 text-sm text-[#1F2640] outline-none transition focus:bg-white ${
              expiryInvalid ? "border-[#F5B5B3]" : "border-[#ECEEF4] focus:border-primary-300"
            }`}
          />
          {expiryInvalid ? (
            <p className="mt-1 text-xs text-[#E35D5B]">Invalid or past expiry</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">CVV</label>
          <div
            className={`flex items-center overflow-hidden rounded-lg border bg-[#FAFBFE] transition focus-within:bg-white ${
              cvvInvalid ? "border-[#F5B5B3]" : "border-[#ECEEF4]"
            }`}
          >
            <input
              type={showCvv ? "text" : "password"}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={cardType === "amex" ? "4 digits" : "3 digits"}
              value={details.cvv}
              onChange={(e) =>
                onChange({ cvv: e.target.value.replace(/\D/g, "").slice(0, maxCvv) })
              }
              className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-sm text-[#1F2640] outline-none placeholder:text-[#8E93A7]"
            />
            <button
              type="button"
              onClick={() => setShowCvv((s) => !s)}
              aria-label={showCvv ? "Hide CVV" : "Show CVV"}
              className="flex h-full items-center px-3 text-[#7E8498] transition hover:text-[#1A2138]"
            >
              {showCvv ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[#8E93A7]">
        Your card details are handled over a secure session. Never share your CVV with anyone.
      </p>
    </div>
  );
}

export function isBankTransferValid(details: DepositCardDetails): boolean {
  if (!details.cardholder.trim()) return false;
  if (!luhnCheck(details.number)) return false;
  if (!isExpiryValid(details.expiry)) return false;
  const cardType = detectCardType(details.number);
  if (!isCvvValid(details.cvv, cardType)) return false;
  return true;
}
