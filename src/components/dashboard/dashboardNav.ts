import {
  ArrowLeftRight,
  Banknote,
  Bot,
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
  activePrefix?: string;
  badge?: string;
  icon: ComponentType<{ className?: string }>;
  children?: DashboardNavItem[];
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardNavItemActiveState = {
  self: boolean;
  child: boolean;
  active: boolean;
};

export const dashboardNavGroups: DashboardNavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
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
      {
        label: "Agents",
        href: "/dashboard/treasury-copilot",
        icon: Bot,
        children: [
          {
            label: "Treasury AI",
            href: "/dashboard/treasury-copilot",
            badge: "Beta",
            icon: Sparkles,
          },
        ],
      },
      {
        label: "Invoicing",
        href: "/dashboard/invoices/create",
        activePrefix: "/dashboard/invoices",
        icon: ReceiptText,
      },
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

export function isDashboardNavItemActive(
  item: Pick<DashboardNavItem, "href" | "activePrefix"> | string,
  pathname: string,
): boolean {
  const href = typeof item === "string" ? item : item.href;
  const activePrefix = typeof item === "string" ? undefined : item.activePrefix;

  if (href === "/dashboard") return pathname === href;

  const prefix = activePrefix ?? href;
  return pathname === href || pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getDashboardNavItemActiveState(
  item: DashboardNavItem,
  pathname: string,
): DashboardNavItemActiveState {
  const self = isDashboardNavItemActive(item, pathname);
  const child = item.children?.some((childItem) => isDashboardNavItemActive(childItem, pathname)) ?? false;

  return {
    self,
    child,
    active: self || child,
  };
}
