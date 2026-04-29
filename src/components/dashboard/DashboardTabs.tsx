"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2, LayoutDashboard, ShieldCheck, Wallet, ArrowLeftRight, FileText } from "lucide-react";
import { dashboardTabs } from "@/components/dashboard/dashboardData";

const iconMap = {
  Dashboard: LayoutDashboard,
  Transactions: ArrowLeftRight,
  Wallets: Wallet,
  Reports: FileText,
  Verification: ShieldCheck,
  Developer: Code2,
};

export default function DashboardTabs() {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto bg-surface">
      <div className="flex min-w-max items-center gap-6">
        {dashboardTabs.map((tab) => {
          const Icon = iconMap[tab.label as keyof typeof iconMap];
          const active =
            tab.href === "/dashboard"
              ? pathname === tab.href
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`group relative flex items-center gap-2 py-4 text-sm transition ${
                active
                  ? "font-semibold text-primary-600"
                  : "font-medium text-foreground-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge ? (
                <span className="rounded-full bg-[#FFE8EE] px-2 py-0.5 text-[10px] font-semibold text-[#FF6B8E] dark:bg-[#3a0d1a]">
                  {tab.badge}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-500" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}