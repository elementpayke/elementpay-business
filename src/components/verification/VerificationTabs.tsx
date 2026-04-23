"use client";

import { BadgeCheck } from "lucide-react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import type {
  VerificationTab,
  VerificationTabKey,
  VerificationTier,
} from "@/lib/verification/types";

type VerificationTabsProps = {
  activeTab: VerificationTabKey;
  tabs: VerificationTab[];
  tiers: VerificationTier[];
  onChange: (tab: VerificationTabKey) => void;
};

export default function VerificationTabs({
  activeTab,
  tabs,
  tiers,
  onChange,
}: VerificationTabsProps) {
  return (
    <div className="border-b border-[#ECEEF5]">
      <div
        role="tablist"
        aria-label="Verification sections"
        className="flex min-w-max items-center gap-7 overflow-x-auto"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const tier = tiers.find((item) => item.key === tab.key);
          const showCompletedMarker = Boolean(tier?.completed);

          return (
            <button
              key={tab.key}
              id={`verification-tab-${tab.key}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`verification-panel-${tab.key}`}
              onClick={() => onChange(tab.key)}
              className={mergeClasses(
                "relative -mb-px flex items-center gap-2 py-4 text-sm transition",
                isActive
                  ? "font-semibold text-primary-600"
                  : "font-medium text-[#81879A] hover:text-[#232B45]",
              )}
            >
              <span>{tab.label}</span>
              {showCompletedMarker ? <BadgeCheck className="h-4 w-4 text-tertiary-500" /> : null}
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
