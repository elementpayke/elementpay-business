import {
  ArrowLeftRight,
  Banknote,
  Code2,
  FileText,
  Headphones,
  LayoutDashboard,
  ReceiptText,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import type { ComponentType } from "react";

export type DashboardNavItem = {
  label: string;
  href: string;
  badge?: string;
  icon: ComponentType<{ className?: string }>;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Treasury AI", href: "/dashboard/treasury-copilot", badge: "Beta", icon: Sparkles },
      { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
      { label: "Wallets", href: "/dashboard/wallets", icon: Wallet },
    ],
  },
  {
    label: "Money movement",
    items: [
      { label: "Send Payment", href: "/dashboard/send-payment", icon: Send },
      { label: "Bulk Payment", href: "/dashboard/bulk-payment", icon: Upload },
      { label: "Deposit Money", href: "/dashboard/deposit-money", icon: Banknote },
    ],
  },
  {
    label: "Business tools",
    items: [
      { label: "Invoicing", href: "/dashboard/invoices/create", icon: ReceiptText },
      { label: "Reports", href: "/dashboard/reports", icon: FileText },
      { label: "Verification", href: "/dashboard/verification", badge: "Tier 2", icon: ShieldCheck },
      { label: "Developer", href: "/dashboard/developer", icon: Code2 },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Contact Support", href: "/dashboard/support", icon: Headphones },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function isDashboardNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
