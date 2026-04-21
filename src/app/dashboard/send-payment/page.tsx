"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cardClassName, DropdownTrigger } from "@/components/dashboard/DashboardPrimitives";
import RecipientForm, { type RecipientFormValues } from "@/components/payments/RecipientForm";
import RecipientList from "@/components/payments/RecipientList";
import Stepper from "@/components/payments/Stepper";
import { payoutCurrencies, type SavedRecipient } from "@/components/payments/paymentData";
import { useSelectedWallet } from "@/lib/wallets/useSelectedWallet";
import { shortAddress } from "@/lib/wallets/wallet-selection";

const amountSchema = z.object({
  amount: z.number().positive("Enter a valid amount"),
  currency: z.string().min(1, "Select a currency"),
  sourceWallet: z.string().min(1, "Select a source wallet"),
});

type AmountFormValues = z.infer<typeof amountSchema>;

function HistoryButton({ disabled = false, children, onClick }: { disabled?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E7EAF3] bg-white text-[#6B7287] transition hover:-translate-y-0.5 hover:border-[#D9DEEC] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export default function SendPaymentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRecipient, setSelectedRecipient] = useState<SavedRecipient | null>(null);
  const [recipientValues, setRecipientValues] = useState<RecipientFormValues | null>(null);
  const [amountValues, setAmountValues] = useState<AmountFormValues | null>(null);

  const { wallets, selectedWallet, selectedWalletAddress, setSelectedWallet } = useSelectedWallet();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    mode: "onChange",
    defaultValues: {
      amount: 2500,
      currency: "KES",
      sourceWallet: selectedWalletAddress ?? "",
    },
  });

  const watchedSourceWalletAddress = watch("sourceWallet");
  const sourceWalletForSummary =
    wallets.find((w) => w.address.toLowerCase() === watchedSourceWalletAddress.toLowerCase()) ??
    selectedWallet;

  const watchedAmount = watch("amount") ?? 0;
  const watchedCurrency = watch("currency") || "KES";
  const fee = Math.max(65, Math.round(Number(watchedAmount || 0) * 0.012));
  const totalDebit = Number(watchedAmount || 0) + fee;

  function handleRecipientSubmit(values: RecipientFormValues) {
    setRecipientValues(values);
    setCurrentStep(2);
  }

  function handleAmountSubmit(values: AmountFormValues) {
    setAmountValues(values);
    setCurrentStep(3);
  }

  function handleConfirmPayment() {
    router.push("/dashboard");
  }

  return (
    <section className="space-y-6">
      <div className="border-b border-[#E8EBF3] pb-5">
        <div className="flex items-center gap-3">
          <HistoryButton onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </HistoryButton>
          <HistoryButton disabled>
            <ChevronRight className="h-4 w-4" />
          </HistoryButton>
          <h1 className="ml-1 text-[28px] font-semibold tracking-[-0.04em] text-[#171D32]">Send Payment</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[820px] space-y-4">
        <Stepper currentStep={currentStep} />

        {currentStep === 1 ? (
          <>
            <RecipientForm
              initialValues={recipientValues ?? undefined}
              selectedRecipient={selectedRecipient}
              onSubmit={handleRecipientSubmit}
            />
            <RecipientList onSelect={setSelectedRecipient} />
          </>
        ) : null}

        {currentStep === 2 ? (
          <div className={cardClassName("grid gap-5 p-5 sm:grid-cols-[minmax(0,1.2fr)_280px]")}>
            <form className="space-y-4" onSubmit={handleSubmit(handleAmountSubmit)}>
              <div>
                <label className="mb-2 block text-xs text-[#4D556D]">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  {...register("amount", { valueAsNumber: true })}
                  className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
                />
                {errors.amount?.message ? <p className="mt-2 text-xs text-[#E35D5B]">{errors.amount.message}</p> : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-[#4D556D]">Currency</label>
                  <select
                    {...register("currency")}
                    className="h-12 w-full rounded-xl border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
                  >
                    {payoutCurrencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-[#4D556D]">Source wallet</label>
                  <select
                    {...register("sourceWallet", {
                      onChange: (e) => {
                        const address = e.target.value as `0x${string}`;
                        if (address) setSelectedWallet(address);
                      },
                    })}
                    className="h-12 w-full rounded-lg border border-[#ECEEF4] bg-[#FAFBFE] px-4 text-sm text-[#1F2640] outline-none transition focus:border-primary-300 focus:bg-white"
                  >
                    {wallets.length === 0 ? (
                      <option value="">No wallet connected</option>
                    ) : null}
                    {wallets.map((wallet) => (
                      <option key={wallet.address} value={wallet.address}>
                        {wallet.label} · {wallet.balance.formatted} {wallet.balance.symbol}
                      </option>
                    ))}
                  </select>
                  {selectedWalletAddress ? (
                    <p className="mt-2 text-[11px] text-[#9298AC]">
                      Signs from {shortAddress(selectedWalletAddress)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-[#EEF0F6] bg-[#FAFBFE] p-4 text-sm text-[#4F576E]">
                <div className="flex items-center justify-between py-2">
                  <span>Fees preview</span>
                  <span className="font-medium">{watchedCurrency} {fee.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>FX rate</span>
                  <span className="font-medium">1 USD = 129.00 KES</span>
                </div>
                <div className="flex items-center justify-between py-2 text-[#1D243C]">
                  <span className="font-semibold">Total debit</span>
                  <span className="font-semibold">{watchedCurrency} {totalDebit.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="h-12 rounded-xl border border-[#E1E4EE] px-4 text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!isValid}
                  className="h-12 flex-1 rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Continue to review
                </button>
              </div>
            </form>

            <div className="rounded-[22px] border border-[#EEF0F6] bg-[#FCFCFF] p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1D243C]">Payment summary</h2>
                <DropdownTrigger label="Priority" compact />
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E93A7]">Recipient</dt>
                  <dd className="text-right font-medium text-[#1D243C]">{recipientValues?.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E93A7]">Destination</dt>
                  <dd className="text-right font-medium text-[#1D243C]">{recipientValues?.country}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E93A7]">Payment rail</dt>
                  <dd className="text-right font-medium text-[#1D243C]">{recipientValues?.paymentMethod}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className={cardClassName("space-y-6 p-6") }>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#1D243C]">Review payment</p>
                <p className="mt-2 text-sm text-[#7E8498]">Double-check the payout before funds leave your source wallet.</p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-xl border border-[#E1E4EE] px-4 py-2 text-sm font-semibold text-[#303854] transition hover:border-[#CBD2E5]"
              >
                Edit details
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#EEF0F6] p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A1A7BA]">Recipient</h3>
                <p className="mt-4 text-lg font-semibold text-[#171D32]">{selectedRecipient?.name ?? "Recipient"}</p>
                <p className="mt-2 text-sm text-[#6E7690]">{recipientValues?.email}</p>
                <p className="mt-2 text-sm text-[#6E7690]">{recipientValues?.country} · {recipientValues?.paymentMethod}</p>
              </div>

              <div className="rounded-2xl border border-[#EEF0F6] p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A1A7BA]">Amount details</h3>
                <p className="mt-4 text-lg font-semibold text-[#171D32]">{amountValues?.currency} {amountValues?.amount.toLocaleString()}</p>
                <p className="mt-2 text-sm text-[#6E7690]">Fees: {amountValues?.currency} {fee.toLocaleString()}</p>
                <p className="mt-2 text-sm text-[#6E7690]">Estimated arrival: Within 10 minutes</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EEF0F6] bg-[#FAFBFE] p-5">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E93A7]">Source wallet</dt>
                  <dd className="font-medium text-[#1D243C]">
                    {sourceWalletForSummary?.label ?? amountValues?.sourceWallet}
                    {sourceWalletForSummary?.address ? (
                      <span className="ml-2 text-xs font-normal text-[#8E93A7]">
                        {shortAddress(sourceWalletForSummary.address)}
                      </span>
                    ) : null}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E93A7]">Exchange rate</dt>
                  <dd className="font-medium text-[#1D243C]">1 USD = 129.00 KES</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#8E93A7]">Total debit</dt>
                  <dd className="font-semibold text-[#1D243C]">{amountValues?.currency} {totalDebit.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <button
              type="button"
              onClick={handleConfirmPayment}
              className="h-12 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white transition hover:brightness-105"
            >
              Confirm payment
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}