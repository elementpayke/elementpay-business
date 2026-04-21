"use client";

import { CircleDollarSign, UserRound, WalletCards } from "lucide-react";
import { stepLabels } from "@/components/payments/paymentData";

const icons = [UserRound, CircleDollarSign, WalletCards];

export default function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="rounded-[20px] border border-[#E9EAF2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
      <div className="grid gap-4 sm:grid-cols-3">
        {stepLabels.map((label, index) => {
          const Icon = icons[index];
          const active = index + 1 === currentStep;
          const complete = index + 1 < currentStep;

          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  active || complete
                    ? "border-tertiary-300 bg-tertiary-100 text-tertiary-700"
                    : "border-[#E9EAF2] bg-[#FAFBFE] text-[#9CA3B6]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className={`h-px w-full ${index !== stepLabels.length - 1 ? "bg-[#E8EBF3]" : "bg-transparent"}`} />
                <p className={`mt-2 text-xs ${active ? "font-semibold text-[#1E243A]" : "text-[#9399AE]"}`}>{label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}