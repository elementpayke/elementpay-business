"use client";

import RecipientForm, {
  type RecipientFormValues,
  type RecipientSubmit,
} from "@/components/payments/RecipientForm";
import { useSendPaymentStore } from "@/stores/sendPaymentStore";

export default function RecipientStep() {
  const storeRecipient = useSendPaymentStore((s) => s.recipient);
  const setRecipient = useSendPaymentStore((s) => s.setRecipient);
  const setPhase = useSendPaymentStore((s) => s.setPhase);

  const initial: Partial<RecipientFormValues> | undefined = storeRecipient
    ? {
        email: storeRecipient.email,
        countryCode: storeRecipient.countryCode,
        methodKey: storeRecipient.methodOptionKey,
        accountNumber: storeRecipient.accountNumber,
        accountName: storeRecipient.name ?? "",
        bankCode: storeRecipient.bankCode ?? "",
        bankPhoneNumber: storeRecipient.bankPhoneNumber ?? "",
      }
    : undefined;

  function handleSubmit(values: RecipientSubmit) {
    const isMomo = values.methodKey === "momo";
    setRecipient({
      email: values.email,
      country: values.countryName,
      countryCode: values.countryCode,
      receiveCurrency: values.receiveCurrency,
      paymentMethod: values.methodLabel,
      methodOptionKey: values.methodOptionKey,
      accountType: isMomo ? "momo" : "bank",
      accountNumber: values.accountNumber,
      name: values.accountName,
      bankCode: isMomo ? undefined : values.bankCode,
      bankPhoneNumber: isMomo ? undefined : values.bankPhoneNumber,
    });
    setPhase("payment-amount");
  }

  return <RecipientForm initialValues={initial} onSubmit={handleSubmit} />;
}
