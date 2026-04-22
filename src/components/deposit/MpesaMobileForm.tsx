"use client";

import { Check } from "lucide-react";
import { validateKenyanPhoneNumber } from "@/lib/phoneValidation";

type MpesaMobileFormProps = {
  phoneNumber: string;
  onPhoneChange: (val: string) => void;
  savePhone: boolean;
  onSavePhoneChange: (val: boolean) => void;
};

export default function MpesaMobileForm({
  phoneNumber,
  onPhoneChange,
  savePhone,
  onSavePhoneChange,
}: MpesaMobileFormProps) {
  const fullPhone = phoneNumber ? `254${phoneNumber}` : "";
  const validation = fullPhone
    ? validateKenyanPhoneNumber(fullPhone)
    : ({ isValid: false } as ReturnType<typeof validateKenyanPhoneNumber>);

  const showError = phoneNumber.length > 0 && !validation.isValid;

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#4D556D]">
          M-Pesa phone number
        </label>
        <div
          className={`flex overflow-hidden rounded-lg border bg-[#FAFBFE] transition focus-within:bg-white ${
            showError
              ? "border-[#F5B5B3]"
              : validation.isValid
                ? "border-tertiary-300"
                : "border-[#ECEEF4]"
          }`}
        >
          <div className="flex items-center gap-1.5 border-r border-[#ECEEF4] px-3 py-3 text-xs font-medium text-[#4D556D]">
            <span>🇰🇪</span>
            <span>+254</span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="7XX XXX XXX"
            value={phoneNumber}
            onChange={(e) =>
              onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 9))
            }
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-[#1F2640] outline-none placeholder:text-[#8E93A7]"
          />
          {validation.isValid ? (
            <div className="flex items-center pr-3">
              <Check className="h-4 w-4 text-tertiary-500" />
            </div>
          ) : null}
        </div>
        {showError && validation.error ? (
          <p className="mt-1 text-xs text-[#E35D5B]">{validation.error}</p>
        ) : (
          <p className="mt-1 text-[11px] text-[#8E93A7]">
            You&apos;ll receive an M-Pesa STK push on this number.
          </p>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs text-[#4D556D]">
        <input
          type="checkbox"
          checked={savePhone}
          onChange={(e) => onSavePhoneChange(e.target.checked)}
          className="h-4 w-4 rounded border-[#D1D5E0] text-primary-500 focus:ring-primary-300"
        />
        Save phone number as default
      </label>
    </div>
  );
}
