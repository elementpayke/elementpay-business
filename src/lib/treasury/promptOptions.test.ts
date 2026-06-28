import { describe, expect, it } from "vitest";
import { parseInvoiceIntakeRequest } from "@/lib/treasury/invoiceIntake";
import { nuruPromptOptions } from "@/lib/treasury/promptOptions";

describe("nuruPromptOptions", () => {
  it("offers the recommended treasury prompt shortcuts", () => {
    expect(nuruPromptOptions.map((option) => option.label)).toEqual([
      "Create invoice",
      "Check balance",
      "Preview payout",
      "Review document",
    ]);
  });

  it("uses an invoice prompt compatible with the intake flow", () => {
    const createInvoice = nuruPromptOptions.find(
      (option) => option.id === "create-invoice",
    );

    expect(createInvoice).toBeDefined();
    expect(parseInvoiceIntakeRequest(createInvoice!.prompt)).toEqual({
      clientName: "Jane Doe",
      amount: "500.00",
      currency: "USD",
    });
  });
});
