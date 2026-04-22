"use client";

import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useDepositStore } from "@/stores/depositStore";

export default function DepositErrorStep() {
  const router = useRouter();
  const { errorMessage, setPhase } = useDepositStore();

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <span className="flex h-[140px] w-[140px] items-center justify-center rounded-full bg-[#FFE5E5] text-secondary-500">
          <AlertCircle className="h-16 w-16" />
        </span>
      </div>

      <div className="mx-auto max-w-[560px] rounded-xl border border-[#ECEEF5] bg-white p-8 text-center">
        <p className="text-2xl font-bold text-[#1A2138]">Deposit failed</p>
        <p className="mt-3 text-sm text-[#7E8498]">
          {errorMessage ?? "Something went wrong while processing your deposit."}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-primary-200 text-sm font-semibold text-primary-500 transition hover:bg-primary-100/40"
          >
            Back to dashboard
          </button>
          <button
            type="button"
            onClick={() => setPhase("confirm-deposit")}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
