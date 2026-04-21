"use client";

import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";

export type WalletTabKey = "account" | "beneficiaries" | "transactions";

const TABS: { key: WalletTabKey; label: string }[] = [
  { key: "account", label: "Account details" },
  { key: "beneficiaries", label: "Beneficiaries" },
  { key: "transactions", label: "Transactions" },
];

export default function WalletTabs({
  active,
  onChange,
}: {
  active: WalletTabKey;
  onChange: (key: WalletTabKey) => void;
}) {
  return (
    <div className="border-b border-[#ECEEF5]">
      <div className="flex items-center gap-6 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={mergeClasses(
                "relative -mb-px py-3 text-sm transition",
                isActive
                  ? "font-semibold text-primary-600"
                  : "font-medium text-[#81879A] hover:text-[#232B45]",
              )}
            >
              {tab.label}
              {isActive ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary-500" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
