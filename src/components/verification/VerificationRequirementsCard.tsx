"use client";

import { cardClassName } from "@/components/dashboard/DashboardPrimitives";
import type { VerificationTabKey, VerificationTier } from "@/lib/verification/types";
import {
  VerificationRequirementStatusText,
  VerificationTierStateBadge,
} from "@/components/verification/VerificationBadges";

type VerificationRequirementsCardProps = {
  tiers: VerificationTier[];
  onSelectTab: (tab: VerificationTabKey) => void;
};

export default function VerificationRequirementsCard({
  tiers,
  onSelectTab,
}: VerificationRequirementsCardProps) {
  return (
    <section className={cardClassName("p-6 transition-shadow hover:shadow-[0_12px_32px_rgba(17,24,39,0.04)]")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#1D243C]">
            Verification progress
          </h2>
          <p className="mt-1 text-sm text-[#7E8498]">
            Review each tier&apos;s requirements and current submission state.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {tiers.map((tier) => (
          <div key={tier.id} className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-base font-medium text-[#202742]">
                  {tier.name}: {tier.title}
                </h3>
                <VerificationTierStateBadge tier={tier} />
              </div>

              <button
                type="button"
                onClick={() => onSelectTab(tier.key)}
                className="text-sm font-medium text-primary-600 transition hover:text-primary-700"
              >
                View details
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#EEF0F6] bg-[#FAFBFE]">
              {tier.requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t border-[#EEF1F7] px-4 py-3 first:border-t-0"
                >
                  <p className="text-sm text-[#6E758C]">{requirement.label}</p>
                  <VerificationRequirementStatusText status={requirement.status} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
