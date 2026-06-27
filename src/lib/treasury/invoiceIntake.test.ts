import { describe, expect, it } from "vitest";
import {
  buildInvoiceIntakeAssistantMessage,
  buildInvoiceIntakeFollowUpMessage,
  createEmptyInvoiceIntakeFields,
  parseInvoiceIntakeRequest,
  validateInvoiceIntakeFields,
  type InvoiceIntakeDraft,
} from "@/lib/treasury/invoiceIntake";

describe("parseInvoiceIntakeRequest", () => {
  it("parses a compact invoice request with a trailing dollar sign", () => {
    expect(parseInvoiceIntakeRequest("invoice jane doe 50$")).toEqual({
      clientName: "Jane Doe",
      amount: "50.00",
      currency: "USD",
    });
  });

  it("parses an invoice request with client and formatted dollar amount", () => {
    expect(
      parseInvoiceIntakeRequest("create invoice for acme ltd for $1,200.50"),
    ).toEqual({
      clientName: "Acme Ltd",
      amount: "1200.50",
      currency: "USD",
    });
  });

  it("parses compact invoice requests with a for separator before the amount", () => {
    expect(parseInvoiceIntakeRequest("invoice jane doe for $50")).toEqual({
      clientName: "Jane Doe",
      amount: "50.00",
      currency: "USD",
    });
  });

  it("rejects USD amounts with more than two decimal places", () => {
    expect(parseInvoiceIntakeRequest("invoice jane doe $1.005")).toBeNull();
    expect(parseInvoiceIntakeRequest("invoice jane doe $1.999")).toBeNull();
  });

  it("ignores non-invoice treasury requests", () => {
    expect(parseInvoiceIntakeRequest("what is our treasury balance?")).toBeNull();
  });
});

describe("invoice intake messages", () => {
  const draft: InvoiceIntakeDraft = {
    clientName: "Jane Doe",
    amount: "50.00",
    currency: "USD",
  };

  it("builds the assistant prompt for missing invoice details", () => {
    expect(buildInvoiceIntakeAssistantMessage(draft)).toBe(
      "To draft this invoice I need a couple of details about Jane Doe and your billing address.",
    );
  });

  it("builds the follow-up confirmation prompt from supplied fields", () => {
    const fields = {
      clientEmail: " jane@example.com ",
      lineItemDescription: " Services ",
      businessStreetAddress: " Kijabe Street ",
      businessCity: " Nairobi ",
      businessCountry: " KE ",
      businessPostalCode: " 00800 ",
    };

    const message = buildInvoiceIntakeFollowUpMessage(draft, fields);

    expect(message).toContain("Create an invoice draft with these details:");
    expect(message).toContain("- Client: Jane Doe <jane@example.com>");
    expect(message).toContain("- Amount: USD 50.00");
    expect(message).toContain("- Line item: Services");
    expect(message).toContain(
      "- Biller address: Kijabe Street, Nairobi, KE, 00800",
    );
    expect(message).toContain(
      "Use the existing confirmation flow before creating or changing records.",
    );
  });
});

describe("validateInvoiceIntakeFields", () => {
  it("returns draft-specific validation errors for missing required fields", () => {
    const draft: InvoiceIntakeDraft = {
      clientName: "Jane Doe",
      amount: "50.00",
      currency: "USD",
    };

    expect(validateInvoiceIntakeFields(createEmptyInvoiceIntakeFields(), draft))
      .toEqual({
        valid: false,
        errors: {
          clientEmail: "Jane Doe's email is required.",
          lineItemDescription: "Line item description is required.",
          businessStreetAddress: "Street address is required.",
          businessCity: "City is required.",
          businessCountry: "Country is required.",
          businessPostalCode: "ZIP / postal code is required.",
        },
      });
  });

  it("accepts whitespace-padded required fields", () => {
    expect(
      validateInvoiceIntakeFields({
        clientEmail: " jane@example.com ",
        lineItemDescription: " Services ",
        businessStreetAddress: " Kijabe Street ",
        businessCity: " Nairobi ",
        businessCountry: " KE ",
        businessPostalCode: " 00800 ",
      }),
    ).toEqual({
      valid: true,
      errors: {},
    });
  });
});
