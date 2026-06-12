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
        bankCode: storeRecipient.bankCode ?? "",
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
      bankCode: isMomo ? undefined : values.bankCode,
      bankName: isMomo ? undefined : values.bankName,
      bankNetworkId: isMomo ? undefined : values.bankNetworkId,
    });
    setPhase("payment-amount");
  }

  return <RecipientForm initialValues={initial} onSubmit={handleSubmit} />;
}
