"use client";

import Link from "next/link";
import { FilePlus2, Plus, Send, Users } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import { quickActions } from "@/components/dashboard/dashboardData";

const iconMap = {
  "Send Payment": Send,
  "Bulk Payment": Users,
  "Create Invoice": FilePlus2,
  "Deposit Funds": Plus,
};

const toneMap = {
  primary: "bg-primary-100 text-primary-600",
  secondary: "bg-secondary-100 text-secondary-600",
  tertiary: "bg-tertiary-100 text-tertiary-700",
  neutral: "bg-[#1B1F2A] text-white",
};

export default function QuickActions() {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Quick actions</h3>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((action) => {
          const Icon = iconMap[action.title as keyof typeof iconMap];

          return (
            <Link
              key={action.title}
              href={action.href ?? "/dashboard"}
              className={cardClassName(
                "group flex flex-col gap-3 p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#D9DDF0] hover:shadow-[0_8px_20px_rgba(17,24,39,0.05)]",
              )}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneMap[action.tone]}`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{action.title}</h3>
                <p className="mt-1 text-[11px] leading-4 text-foreground-muted">{action.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}