export const countries = ["Kenya", "Nigeria", "Ghana", "Uganda", "Tanzania"] as const;

export type Country = (typeof countries)[number];

export const paymentMethodsByCountry: Record<Country, string[]> = {
  Kenya: ["M-Pesa Mobile Money", "Bank Transfer", "M-Pesa Paybill"],
  Nigeria: ["Bank Transfer", "USSD", "Wallet Transfer"],
  Ghana: ["Vodafone Cash", "MTN MoMo", "Bank Transfer"],
  Uganda: ["Mobile Money", "Bank Transfer", "Airtel Money"],
  Tanzania: ["M-Pesa", "Tigo Pesa", "Bank Transfer"],
};

export type SavedRecipient = {
  name: string;
  email: string;
  country: Country;
  paymentMethod: string;
  flag: string;
  label: string;
};

export const savedRecipients: SavedRecipient[] = [
  {
    name: "Aly Mitsumi",
    email: "alymitsumi@elementpay.com",
    country: "Kenya",
    paymentMethod: "M-Pesa Mobile Money",
    flag: "🇰🇪",
    label: "Kenya",
  },
  {
    name: "Sarah Okonkwo",
    email: "sakonkwo@elementpay.com",
    country: "Nigeria",
    paymentMethod: "GT Bank",
    flag: "🇳🇬",
    label: "Nigeria",
  },
  {
    name: "John Mensah",
    email: "johnmensah@elementpay.com",
    country: "Ghana",
    paymentMethod: "Vodafone Cash",
    flag: "🇬🇭",
    label: "Ghana",
  },
];

export const sourceWallets = ["KES Operating Wallet", "USD Treasury Wallet", "NGN Collection Wallet"];
export const payoutCurrencies = ["KES", "USD", "NGN", "GHS"];

export const stepLabels = ["Recipient details", "Payment amount", "Payment review"];