import { describe, expect, it } from "vitest";
import { buildInvoiceSendPlan } from "@/lib/invoices/sendPlan";

describe("invoice send plan", () => {
  it("keeps WhatsApp out of backend delivery so local WhatsApp config is not required", () => {
    expect(buildInvoiceSendPlan(["whatsapp"])).toEqual({
      issueSendVia: "none",
      backendSendVia: null,
      shouldOpenWhatsApp: true,
    });
    expect(buildInvoiceSendPlan(["email", "whatsapp"])).toEqual({
      issueSendVia: "none",
      backendSendVia: "email",
      shouldOpenWhatsApp: true,
    });
  });
});
