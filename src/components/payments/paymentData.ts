export const countries = ["Kenya", "Nigeria", "Ghana", "Uganda", "Tanzania"] as const;

export type Country = (typeof countries)[number];

export const paymentMethodsByCountry: Record<Country, string[]> = {
  Kenya: ["M-Pesa Mobile Money", "Bank Transfer", "M-Pesa Paybill"],
  Nigeria: ["Bank Transfer", "USSD", "Wallet Transfer"],
  Ghana: ["Vodafone Cash", "MTN MoMo", "Bank Transfer"],
  Uganda: ["Mobile Money", "Bank Transfer", "Airtel Money"],
  Tanzania: ["M-Pesa", "Tigo Pesa", "Bank Transfer"],
};

export const COUNTRY_CODE: Record<Country, string> = {
  Kenya: "KE",
  Nigeria: "NG",
  Ghana: "GH",
  Uganda: "UG",
  Tanzania: "TZ",
};

export const COUNTRY_CURRENCY: Record<Country, string> = {
  Kenya: "KES",
  Nigeria: "NGN",
  Ghana: "GHS",
  Uganda: "UGX",
  Tanzania: "TZS",
};

export function isMobileMoneyMethod(method: string): boolean {
  return /m-?pesa|momo|airtel|vodafone|mobile money/i.test(method);
}

export const stepLabels = ["Recipient details", "Payment amount", "Payment review"];
