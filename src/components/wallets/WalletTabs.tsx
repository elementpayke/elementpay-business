"use client";

import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";

export type WalletTabKey =
  | "account"
  | "beneficiaries"
  | "transactions";

const TABS: {
  key: WalletTabKey;
  label: string;
}[] = [
  {
    key: "account",
    label: "Account details",
  },
  {
    key: "beneficiaries",
    label: "Beneficiaries",
  },
  {
    key: "transactions",
    label: "Transactions",
  },
];

export default function WalletTabs({
  active,
  onChange,
}: {
  active: WalletTabKey;
  onChange: (
    key: WalletTabKey,
  ) => void;
}) {
  return (
    <div className="border-b border-border">
      <div
        className="
          flex items-center gap-6
          overflow-x-auto
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {TABS.map((tab) => {
          const isActive =
            tab.key === active;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() =>
                onChange(tab.key)
              }
              className={mergeClasses(
                "relative -mb-px whitespace-nowrap py-3 text-sm transition-colors",
                isActive
                  ? "font-semibold text-primary-600"
                  : "font-medium text-foreground-muted hover:text-foreground",
              )}
            >
              {tab.label}

              {isActive && (
                <span
                  aria-hidden
                  className="
                    absolute inset-x-0 -bottom-px
                    h-0.5 rounded-full
                    bg-primary-500
                  "
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}