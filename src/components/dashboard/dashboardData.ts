export type TabItem = {
  label: string;
  href: string;
  badge?: string;
};

export type CountryCode = "KE" | "NG" | "GH";

export type QuickAction = {
  title: string;
  description: string;
  tone: "primary" | "secondary" | "tertiary" | "neutral";
  href?: string;
};

export type VolumeDatum = {
  month: string;
  moneyIn: number;
  moneyOut: number;
};

export type CurrencyProgress = {
  name: string;
  code: string;
  amount: string;
  progress: number;
};

export type InvoiceRow = {
  client: string;
  country: CountryCode;
  wallet: string;
  invoiceId: string;
  timestamp: string;
  transactionId: string;
  dueDate: string;
  status: "Pending" | "Defaulting";
  expectedAmount: string;
};

export type PendingPaymentRow = {
  client: string;
  country: CountryCode;
  date: string;
  transactionType: string;
  paymentMethod: string;
  status: "Pending";
  fees: string;
  amount: string;
};

export type RecentTransactionRow = {
  client: string;
  country: CountryCode;
  date: string;
  direction: "in" | "out";
  type: string;
  paymentMethod: string;
  status: "Successful" | "Failed";
  fees: string;
  amount: string;
};

export const dashboardTabs: TabItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Transactions", href: "/dashboard/transactions" },
  { label: "Wallets", href: "/dashboard/wallets" },
  { label: "Reports", href: "/dashboard/reports" },
  { label: "Verification", href: "/dashboard/verification", badge: "Tier 2" },
  { label: "Developer", href: "/dashboard/developer" },
];

export const quickActions: QuickAction[] = [
  {
    title: "Send Payment",
    description: "Transfer money to a recipient instantly",
    tone: "primary",
    href: "/dashboard/send-payment",
  },
  {
    title: "Bulk Payment",
    description: "Send payments to multiple recipients instantly",
    tone: "secondary",
    href: "/dashboard/transactions",
  },
  {
    title: "Create Invoice",
    description: "Request/collect payments",
    tone: "tertiary",
    href: "/dashboard/reports",
  },
  {
    title: "Deposit Funds",
    description: "Send payments to multiple recipients instantly",
    tone: "neutral",
    href: "/dashboard/wallets",
  },
];

export const volumeData: VolumeDatum[] = [
  { month: "Jan", moneyIn: 35000, moneyOut: 30000 },
  { month: "Feb", moneyIn: 35000, moneyOut: 30000 },
  { month: "Mar", moneyIn: 45000, moneyOut: 30000 },
  { month: "Apr", moneyIn: 25000, moneyOut: 30000 },
  { month: "May", moneyIn: 45000, moneyOut: 30000 },
  { month: "Jun", moneyIn: 25000, moneyOut: 35000 },
  { month: "Jul", moneyIn: 25000, moneyOut: 22000 },
  { month: "Aug", moneyIn: 30000, moneyOut: 30000 },
  { month: "Sep", moneyIn: 38000, moneyOut: 25000 },
  { month: "Oct", moneyIn: 40000, moneyOut: 32000 },
  { month: "Nov", moneyIn: 30000, moneyOut: 22000 },
  { month: "Dec", moneyIn: 35000, moneyOut: 30000 },
];

export const topCurrencies: CurrencyProgress[] = [
  { name: "Kenya Shillings", code: "KES", amount: "USD 45,230", progress: 88 },
  { name: "Nigerian Naira", code: "NGN", amount: "USD 31,520", progress: 64 },
  { name: "Ghanaian Cedis", code: "GHS", amount: "USD 26,783", progress: 52 },
];

export const upcomingInvoices: InvoiceRow[] = [
  {
    client: "Aly Mtsumi",
    country: "KE",
    wallet: "Wallet name",
    invoiceId: "inv-2024-0156",
    timestamp: "12/12/2025  12:34:23",
    transactionId: "txn-2024-0156",
    dueDate: "12/02/2026",
    status: "Pending",
    expectedAmount: "KES 212,274",
  },
  {
    client: "Aly Mtsumi",
    country: "KE",
    wallet: "Wallet name",
    invoiceId: "inv-2024-0156",
    timestamp: "12/12/2025  12:34:23",
    transactionId: "txn-2024-0156",
    dueDate: "22/01/2026",
    status: "Pending",
    expectedAmount: "KES 212,274",
  },
  {
    client: "Aly Mtsumi",
    country: "KE",
    wallet: "Wallet name",
    invoiceId: "inv-2024-0156",
    timestamp: "12/12/2025  12:34:23",
    transactionId: "txn-2024-0156",
    dueDate: "12/12/2025",
    status: "Defaulting",
    expectedAmount: "KES 212,274",
  },
];

export const pendingPayments: PendingPaymentRow[] = [
  {
    client: "Aly Mtsumi",
    country: "KE",
    date: "Dec 12 • 12:34pm",
    transactionType: "Bulk payment",
    paymentMethod: "M-Pesa Mobile",
    status: "Pending",
    fees: "KES 22.74",
    amount: "KES 212,274",
  },
  {
    client: "Aly Mtsumi",
    country: "KE",
    date: "Dec 12 • 12:34pm",
    transactionType: "Deposit",
    paymentMethod: "Bank transfer",
    status: "Pending",
    fees: "KES 22.74",
    amount: "KES 212,274",
  },
];

export const recentTransactions: RecentTransactionRow[] = [
  {
    client: "Aly Mtsumi",
    country: "KE",
    date: "Dec 12 • 12:34pm",
    direction: "out",
    type: "Single payment",
    paymentMethod: "M-Pesa Mobile",
    status: "Successful",
    fees: "KES 22.74",
    amount: "-KES 2,274",
  },
  {
    client: "Sarah Okonkwo",
    country: "NG",
    date: "Dec 12 • 12:34pm",
    direction: "in",
    type: "Invoice pay-in",
    paymentMethod: "Bank transfer",
    status: "Successful",
    fees: "NGN 234",
    amount: "+KES 2,274",
  },
  {
    client: "Aly Mtsumi",
    country: "KE",
    date: "Dec 12 • 12:34pm",
    direction: "out",
    type: "Bulk payment",
    paymentMethod: "Bank transfer",
    status: "Successful",
    fees: "KES 22.74",
    amount: "-KES 2,274",
  },
  {
    client: "David Mensah",
    country: "GH",
    date: "Dec 12 • 12:34pm",
    direction: "in",
    type: "Deposit",
    paymentMethod: "Bank transfer",
    status: "Failed",
    fees: "GHS 14.56",
    amount: "+GHS 1,456",
  },
  {
    client: "Sarah Okonkwo",
    country: "NG",
    date: "Dec 12 • 12:34pm",
    direction: "out",
    type: "Single payment",
    paymentMethod: "Bank transfer",
    status: "Successful",
    fees: "NGN 22.74",
    amount: "-NGN 2,274",
  },
  {
    client: "David Mensah",
    country: "GH",
    date: "Dec 12 • 12:34pm",
    direction: "in",
    type: "Invoice pay-in",
    paymentMethod: "MTN MoMo",
    status: "Successful",
    fees: "GHS 22.74",
    amount: "+GHS 2,274",
  },
  {
    client: "Aly Mtsumi",
    country: "KE",
    date: "Dec 12 • 12:34pm",
    direction: "out",
    type: "Single payment",
    paymentMethod: "M-Pesa Mobile",
    status: "Successful",
    fees: "KES 22.74",
    amount: "-KES 2,274",
  },
  {
    client: "Sarah Okonkwo",
    country: "NG",
    date: "Dec 12 • 12:34pm",
    direction: "out",
    type: "Single payment",
    paymentMethod: "Bank transfer",
    status: "Successful",
    fees: "NGN 22.74",
    amount: "-NGN 2,274",
  },
  {
    client: "Aly Mtsumi",
    country: "KE",
    date: "Dec 12 • 12:34pm",
    direction: "out",
    type: "Single payment",
    paymentMethod: "Bank transfer",
    status: "Successful",
    fees: "KES 22.74",
    amount: "-KES 2,274",
  },
  {
    client: "David Mensah",
    country: "GH",
    date: "Dec 12 • 12:34pm",
    direction: "in",
    type: "Invoice pay-in",
    paymentMethod: "Vodafone Cash",
    status: "Successful",
    fees: "GHS 22.74",
    amount: "+GHS 2,274",
  },
];
