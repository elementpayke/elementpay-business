"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import {
  dashboardNavGroups,
  isDashboardNavItemActive,
} from "@/components/dashboard/dashboardNav";

type DashboardSidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export default function DashboardSidebar({ mobile = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`flex h-full flex-col border-r border-border bg-surface ${
        mobile ? "w-full" : "w-[248px]"
      }`}
    >
      <div className="flex h-[72px] items-center justify-between px-5">
        <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
            <span className="block h-3 w-3 rounded-sm bg-white" />
          </span>
          <span className="text-[15px] font-semibold text-[#1C2238] dark:text-white">
            ElementPay
          </span>
        </Link>
        {mobile ? (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6B7287] hover:bg-[#F4F5F9]"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 pb-5">
        {dashboardNavGroups.map((group) => (
          <div key={group.label} className={group.label === "Support" ? "mt-auto" : ""}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E93A7]">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = isDashboardNavItemActive(item, pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onClose}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-primary-100/70 font-semibold text-primary-700"
                        : "font-medium text-[#4D556D] hover:bg-[#F4F6FA] hover:text-[#1F2640]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-[#FFE8EE] px-2 py-0.5 text-[10px] font-semibold text-[#FF6B8E]">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
