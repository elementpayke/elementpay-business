"use client";

import { FileText, FileSearch, UsersRound } from "lucide-react";

const stepLabels = ["Recipients' details", "CSV Upload", "Payment review"] as const;
const icons = [UsersRound, FileText, FileSearch];

type BulkPaymentStepperProps = {
  currentStep: 1 | 2 | 3;
  allComplete?: boolean;
};

export default function BulkPaymentStepper({
  currentStep,
  allComplete = false,
}: BulkPaymentStepperProps) {
  return (
    <div className="rounded-[20px] border border-[#E9EAF2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
      <div className="grid gap-4 sm:grid-cols-3">
        {stepLabels.map((label, index) => {
          const Icon = icons[index];
          const stepNumber = index + 1;
          const active = !allComplete && stepNumber === currentStep;
          const complete = allComplete || stepNumber < currentStep;
          const reached = active || complete;

          return (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                  reached
                    ? "border-tertiary-300 bg-tertiary-100 text-tertiary-700"
                    : "border-[#E9EAF2] bg-[#FAFBFE] text-[#9CA3B6]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={`h-px w-full ${
                    index !== stepLabels.length - 1
                      ? complete
                        ? "bg-tertiary-300"
                        : "bg-[#E8EBF3]"
                      : "bg-transparent"
                  }`}
                />
                <p
                  className={`mt-2 text-xs ${
                    reached
                      ? active
                        ? "font-semibold text-tertiary-700"
                        : "text-tertiary-700"
                      : "text-[#9399AE]"
                  }`}
                >
                  {label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
