export type InvoiceIntakeDraft = {
  clientName: string;
  amount: string;
  currency: "USD";
};

export type InvoiceIntakeFields = {
  clientEmail: string;
  lineItemDescription: string;
  businessStreetAddress: string;
  businessCity: string;
  businessCountry: string;
  businessPostalCode: string;
};

export type InvoiceIntakeFieldErrors = Partial<
  Record<keyof InvoiceIntakeFields, string>
>;

export type InvoiceIntakeValidationResult = {
  valid: boolean;
  errors: InvoiceIntakeFieldErrors;
};

const emptyInvoiceIntakeFields: InvoiceIntakeFields = {
  clientEmail: "",
  lineItemDescription: "",
  businessStreetAddress: "",
  businessCity: "",
  businessCountry: "",
  businessPostalCode: "",
};

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function titleCaseClientName(value: string): string {
  return normalizeWhitespace(value)
    .split(" ")
    .map((token) => {
      if (/^[A-Z]{1,3}$/.test(token)) {
        return token;
      }

      const lowerToken = token.toLowerCase();
      return lowerToken.charAt(0).toUpperCase() + lowerToken.slice(1);
    })
    .join(" ");
}

function normalizeAmount(value: string): string | null {
  const amountText = value
    .replace(/\s+/g, "")
    .replace(/^\$/, "")
    .replace(/\$$/, "")
    .replace(/,/g, "");

  if (!/^\d+(?:\.\d+)?$/.test(amountText)) {
    return null;
  }

  const amount = Number(amountText);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount.toFixed(2);
}

export function parseInvoiceIntakeRequest(
  content: string,
): InvoiceIntakeDraft | null {
  const normalizedContent = normalizeWhitespace(content);

  const createInvoiceMatch = normalizedContent.match(
    /^create invoice for (.+?) for (\$?\s*\d[\d,]*(?:\.\d+)?\$?)$/i,
  );
  const compactInvoiceMatch = normalizedContent.match(
    /^invoice (.+?) (\$?\s*\d[\d,]*(?:\.\d+)?\$?)$/i,
  );
  const match = createInvoiceMatch ?? compactInvoiceMatch;

  if (!match) {
    return null;
  }

  const clientName = titleCaseClientName(match[1]);
  const amount = normalizeAmount(match[2]);

  if (!clientName || !amount) {
    return null;
  }

  return {
    clientName,
    amount,
    currency: "USD",
  };
}

export function createEmptyInvoiceIntakeFields(): InvoiceIntakeFields {
  return { ...emptyInvoiceIntakeFields };
}

export function validateInvoiceIntakeFields(
  fields: InvoiceIntakeFields,
  draft?: InvoiceIntakeDraft,
): InvoiceIntakeValidationResult {
  const errors: InvoiceIntakeFieldErrors = {};

  if (!fields.clientEmail.trim()) {
    errors.clientEmail = draft
      ? `${draft.clientName}'s email is required.`
      : "Customer email is required.";
  }

  if (!fields.lineItemDescription.trim()) {
    errors.lineItemDescription = "Line item description is required.";
  }

  if (!fields.businessStreetAddress.trim()) {
    errors.businessStreetAddress = "Street address is required.";
  }

  if (!fields.businessCity.trim()) {
    errors.businessCity = "City is required.";
  }

  if (!fields.businessCountry.trim()) {
    errors.businessCountry = "Country is required.";
  }

  if (!fields.businessPostalCode.trim()) {
    errors.businessPostalCode = "ZIP / postal code is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function buildInvoiceIntakeAssistantMessage(
  draft: InvoiceIntakeDraft,
): string {
  return `To draft this invoice I need a couple of details about ${draft.clientName} and your billing address.`;
}

export function buildInvoiceIntakeFollowUpMessage(
  draft: InvoiceIntakeDraft,
  fields: InvoiceIntakeFields,
): string {
  const billerAddress = [
    fields.businessStreetAddress,
    fields.businessCity,
    fields.businessCountry,
    fields.businessPostalCode,
  ]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return [
    "Create an invoice draft with these details:",
    `- Client: ${draft.clientName} <${fields.clientEmail.trim()}>`,
    `- Amount: ${draft.currency} ${draft.amount}`,
    `- Line item: ${fields.lineItemDescription.trim()}`,
    `- Biller address: ${billerAddress}`,
    "",
    "Use the existing confirmation flow before creating or changing records.",
  ].join("\n");
}
