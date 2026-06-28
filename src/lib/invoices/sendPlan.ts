import type { SendVia } from "@/lib/invoices/api";

export type InvoiceSendChannel = "email" | "whatsapp";

export type InvoiceSendPlan = {
  issueSendVia: SendVia;
  backendSendVia: SendVia | null;
  shouldOpenWhatsApp: boolean;
};

export function buildInvoiceSendPlan(
  channels: readonly InvoiceSendChannel[],
): InvoiceSendPlan {
  const shouldSendEmail = channels.includes("email");
  const shouldOpenWhatsApp = channels.includes("whatsapp");

  return {
    issueSendVia: "none",
    backendSendVia: shouldSendEmail ? "email" : null,
    shouldOpenWhatsApp,
  };
}
