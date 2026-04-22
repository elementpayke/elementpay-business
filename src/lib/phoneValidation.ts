export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  network?: "Safaricom" | "Unknown";
  formattedNumber?: string;
}

// Validates a Kenyan Safaricom number. Accepts digits only; caller is
// responsible for stripping the local 9-digit form into a full 2547/2541 form.
export function validateKenyanPhoneNumber(phoneNumber: string): PhoneValidationResult {
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  if (!digitsOnly) return { isValid: false, error: "Phone number is required" };
  if (digitsOnly.length < 9) return { isValid: false, error: "Phone number is too short" };
  if (digitsOnly.length > 12) return { isValid: false, error: "Phone number is too long" };

  const safaricomRegex = /^254[17][0-9]{8}$/;
  if (!safaricomRegex.test(digitsOnly)) {
    return {
      isValid: false,
      error: "Only Safaricom numbers (2547XXXXXXXX or 2541XXXXXXXX) are supported",
    };
  }

  const network: "Safaricom" = "Safaricom";

  if (digitsOnly === "254000000000" || digitsOnly === "254111111111") {
    return { isValid: false, error: "Invalid phone number", network };
  }
  const isSequential = /^254[17](?:0{8}|1{8}|2{8}|3{8}|4{8}|5{8}|6{8}|7{8}|8{8}|9{8})$/.test(
    digitsOnly,
  );
  if (isSequential) return { isValid: false, error: "Invalid phone number", network };

  return { isValid: true, network, formattedNumber: digitsOnly };
}
