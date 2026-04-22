"use client";

import { CheckCircle2, CreditCard } from "lucide-react";

type DepositStepperProps = { step: 1 | 2 };

export default function DepositStepper({ step }: DepositStepperProps) {
  return (
    <div className="rounded-[20px] border border-[#E9EAF2] bg-white px-5 py-4 shadow-[0_2px_8px_rgba(16,24,40,0.04)]">
      <div className="grid grid-cols-2 divide-x divide-[#E9EAF2]">
        <Segment active={step === 1} icon={<CreditCard className="h-4 w-4" />} label="Deposit method" />
        <Segment
          active={step === 2}
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Confirm deposit"
          leftPadded
        />
      </div>
    </div>
  );
}

function Segment({
  active,
  icon,
  label,
  leftPadded = false,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  leftPadded?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${leftPadded ? "pl-5" : "pr-5"}`}>
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full border ${
          active
            ? "border-primary-300 bg-primary-100 text-primary-700"
            : "border-[#E9EAF2] bg-[#FAFBFE] text-[#9CA3B6]"
        }`}
      >
        {icon}
      </div>
      <p
        className={`text-sm ${
          active ? "font-semibold text-primary-600" : "text-[#9CA3B6]"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
