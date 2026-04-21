"use client";

import { Bell, MoonStar, Wallet } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";

export default function PreferencesCard() {
  return (
    <div className={cardClassName("p-6")}>
      <h2 className="text-base font-semibold text-[#1D243C]">Preferences</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#EEF0F6] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F7FC] text-[#54607A]">
            <Bell className="h-4 w-4" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[#1D243C]">Notifications</h3>
          <p className="mt-2 text-xs leading-5 text-[#8E93A7]">Instant alerts for incoming funds, approvals, and high value payouts.</p>
        </div>

        <div className="rounded-2xl border border-[#EEF0F6] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F7FC] text-[#54607A]">
            <MoonStar className="h-4 w-4" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[#1D243C]">Theme</h3>
          <p className="mt-2 text-xs leading-5 text-[#8E93A7]">Current preference follows your system setting with smooth transitions disabled.</p>
        </div>

        <div className="rounded-2xl border border-[#EEF0F6] p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F7FC] text-[#54607A]">
            <Wallet className="h-4 w-4" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[#1D243C]">Default currency</h3>
          <p className="mt-2 text-xs leading-5 text-[#8E93A7]">KES is selected as your default reporting currency across dashboards and payment forms.</p>
        </div>
      </div>
    </div>
  );
}