"use client";

import { LaptopMinimal, LockKeyhole, ShieldCheck, Smartphone } from "lucide-react";
import { cardClassName } from "@/components/dashboard/DashboardPrimitives";

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <span className={`flex h-6 w-11 items-center rounded-full p-1 transition ${enabled ? "bg-primary-500" : "bg-[#E8EBF3]"}`}>
      <span className={`h-4 w-4 rounded-full bg-white transition ${enabled ? "translate-x-5" : "translate-x-0"}`} />
    </span>
  );
}

export default function SecurityCard() {
  const rows = [
    { icon: LockKeyhole, title: "Change password", description: "Last updated 18 days ago", action: "Update" },
    { icon: ShieldCheck, title: "Two-factor authentication", description: "Recommended for treasury actions", toggle: true },
    { icon: Smartphone, title: "Authenticator app", description: "Paired with Pixel 9 Pro", action: "Manage" },
    { icon: LaptopMinimal, title: "Active sessions", description: "3 devices signed in", action: "Review" },
  ];

  return (
    <div className={cardClassName("p-6")}>
      <h2 className="text-base font-semibold text-[#1D243C]">Security</h2>
      <div className="mt-5 space-y-4">
        {rows.map((row) => (
          <div key={row.title} className="flex items-center justify-between gap-4 rounded-2xl border border-[#EEF0F6] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F5F7FC] text-[#54607A]">
                <row.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1D243C]">{row.title}</p>
                <p className="mt-1 text-xs text-[#8E93A7]">{row.description}</p>
              </div>
            </div>

            {row.toggle ? (
              <Toggle enabled />
            ) : (
              <button className="rounded-xl border border-[#DFE3EF] px-3 py-2 text-sm font-medium text-[#303854] transition hover:border-[#CAD1E3]">
                {row.action}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}