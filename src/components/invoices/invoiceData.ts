import type { CountryCode } from "@/components/dashboard/dashboardData";

export type InvoiceCountry = {
  code: CountryCode;
  name: string;
  dialCode: string;
  currencyCode: CurrencyCode;
  currencyName: string;
};

export type CurrencyCode = "KES" | "NGN" | "GHS" | "USD" | "UGX" | "TZS";

export const invoiceCountries: InvoiceCountry[] = [
  { code: "KE", name: "Kenya", dialCode: "+254", currencyCode: "KES", currencyName: "Kenyan Shillings" },
  { code: "NG", name: "Nigeria", dialCode: "+234", currencyCode: "NGN", currencyName: "Nigerian Naira" },
  { code: "GH", name: "Ghana", dialCode: "+233", currencyCode: "GHS", currencyName: "Ghanaian Cedis" },
];

export const invoiceCurrencies: Array<{
  code: CurrencyCode;
  name: string;
  country?: CountryCode;
}> = [
  { code: "KES", name: "Kenyan Shillings", country: "KE" },
  { code: "NGN", name: "Nigerian Naira", country: "NG" },
  { code: "GHS", name: "Ghanaian Cedis", country: "GH" },
  { code: "USD", name: "US Dollars" },
];

export type InvoicePaymentMethodRail =
  | "mpesa_paybill"
  | "mpesa_tilt"
  | "bank_transfer"
  | "ussd"
  | "wallet_transfer"
  | "mtn_momo"
  | "vodafone_cash"
  | "airteltigo_money";

export type InvoicePaymentMethod = {
  id: InvoicePaymentMethodRail;
  label: string;
  /** Extra identifier fields collected when this method is selected. */
  fields: Array<{ key: string; label: string; placeholder?: string }>;
};

export const paymentMethodsByCountry: Record<CountryCode, InvoicePaymentMethod[]> = {
  KE: [
    {
      id: "mpesa_paybill",
      label: "M-Pesa Paybill Number",
      fields: [
        { key: "paybillNumber", label: "Paybill number", placeholder: "e.g. 2134572" },
        { key: "accountNumber", label: "Account number", placeholder: "e.g. 467392" },
        { key: "businessName", label: "Business name", placeholder: "Your business name" },
      ],
    },
    {
      id: "mpesa_tilt",
      label: "M-Pesa Till Number",
      fields: [
        { key: "tillNumber", label: "Till number", placeholder: "e.g. 5678910" },
        { key: "businessName", label: "Business name", placeholder: "Your business name" },
      ],
    },
    {
      id: "bank_transfer",
      label: "Bank transfer",
      fields: [
        { key: "bankName", label: "Bank name", placeholder: "e.g. Equity Bank" },
        { key: "accountNumber", label: "Account number" },
        { key: "accountName", label: "Account name" },
      ],
    },
  ],
  NG: [
    {
      id: "bank_transfer",
      label: "Bank transfer",
      fields: [
        { key: "bankName", label: "Bank name", placeholder: "e.g. GT Bank" },
        { key: "accountNumber", label: "Account number" },
        { key: "accountName", label: "Account name" },
      ],
    },
    {
      id: "ussd",
      label: "USSD",
      fields: [{ key: "ussdCode", label: "USSD code", placeholder: "e.g. *737#" }],
    },
    {
      id: "wallet_transfer",
      label: "Wallet transfer",
      fields: [{ key: "walletHandle", label: "Wallet handle" }],
    },
  ],
  GH: [
    {
      id: "mtn_momo",
      label: "MTN MoMo",
      fields: [
        { key: "momoNumber", label: "MoMo number", placeholder: "e.g. 024 XXX XXXX" },
        { key: "businessName", label: "Business name" },
      ],
    },
    {
      id: "vodafone_cash",
      label: "Vodafone Cash",
      fields: [
        { key: "momoNumber", label: "Vodafone number", placeholder: "e.g. 020 XXX XXXX" },
        { key: "businessName", label: "Business name" },
      ],
    },
    {
      id: "airteltigo_money",
      label: "AirtelTigo Money",
      fields: [
        { key: "momoNumber", label: "AirtelTigo number" },
        { key: "businessName", label: "Business name" },
      ],
    },
    {
      id: "bank_transfer",
      label: "Bank transfer",
      fields: [
        { key: "bankName", label: "Bank name" },
        { key: "accountNumber", label: "Account number" },
        { key: "accountName", label: "Account name" },
      ],
    },
  ],
};

export type ReceivingWallet = {
  id: string;
  label: string;
  currency: CurrencyCode;
};

export const receivingWallets: ReceivingWallet[] = [
  { id: "wallet-a", label: "Wallet A", currency: "GHS" },
  { id: "wallet-b", label: "Wallet B", currency: "KES" },
  { id: "wallet-c", label: "USD Treasury", currency: "USD" },
];

export function findCountry(code: CountryCode | "" | null | undefined): InvoiceCountry | undefined {
  if (!code) return undefined;
  return invoiceCountries.find((c) => c.code === code);
}

export function findCurrency(code: CurrencyCode | null | undefined) {
  if (!code) return undefined;
  return invoiceCurrencies.find((c) => c.code === code);
}
