"use client";

import { useState } from "react";
import RecipientForm, { type RecipientFormValues } from "@/components/payments/RecipientForm";
import RecipientList from "@/components/payments/RecipientList";
import { SavedRecipientToDetails, useSendPaymentStore } from "@/stores/sendPaymentStore";
import type { Country, SavedRecipient } from "@/components/payments/paymentData";

export default function RecipientStep() {
  const storeRecipient = useSendPaymentStore((s) => s.recipient);
  const setRecipient = useSendPaymentStore((s) => s.setRecipient);
  const setPhase = useSendPaymentStore((s) => s.setPhase);

  const [selectedRecipient, setSelectedRecipient] = useState<SavedRecipient | null>(null);

  const initial: Partial<RecipientFormValues> | undefined = storeRecipient
    ? {
        email: storeRecipient.email,
        country: storeRecipient.country,
        paymentMethod: storeRecipient.paymentMethod,
        phoneNumber: storeRecipient.phoneNumber,
      }
    : undefined;

  function handleSubmit(values: RecipientFormValues) {
    setRecipient({
      email: values.email,
      country: values.country as Country,
      paymentMethod: values.paymentMethod,
      phoneNumber: values.phoneNumber,
      name: selectedRecipient?.name ?? storeRecipient?.name,
    });
    setPhase("payment-amount");
  }

  function handlePickSaved(recipient: SavedRecipient) {
    setSelectedRecipient(recipient);
    setRecipient(SavedRecipientToDetails(recipient));
  }

  return (
    <>
      <RecipientForm
        initialValues={initial}
        selectedRecipient={selectedRecipient}
        onSubmit={handleSubmit}
      />
      <RecipientList onSelect={handlePickSaved} />
    </>
  );
}
