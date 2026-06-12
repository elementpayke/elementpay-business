import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export type PhoneCheck = {
  /** True when the number is valid for the given country's numbering rules. */
  isValid: boolean;
  /** E.164 form (e.g. "+254712345678") when parseable, else undefined. */
  e164?: string;
  /** User-facing reason when not valid. Undefined when valid or input empty. */
  message?: string;
};

/**
 * Validate a phone number against a country's national numbering rules using
 * libphonenumber-js. `countryCode` is an ISO 3166-1 alpha-2 (the same code the
 * catalog corridors use), which lets users type the local form ("0712…") and
 * still be validated/normalized correctly.
 *
 * Empty input returns `{ isValid: false }` with no message so callers can
 * decide whether emptiness is an error in their own context.
 */
export function validatePhoneForCountry(
  raw: string,
  countryCode: string | null | undefined,
): PhoneCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { isValid: false };

  const region = (countryCode?.toUpperCase() || undefined) as CountryCode | undefined;
  const parsed = parsePhoneNumberFromString(trimmed, region);

  if (!parsed) {
    return {
      isValid: false,
      message: "Enter a valid phone number for the selected country.",
    };
  }
  if (!parsed.isValid()) {
    return {
      isValid: false,
      e164: parsed.number,
      message: "This doesn't look like a valid number for the selected country.",
    };
  }
  return { isValid: true, e164: parsed.number };
}
