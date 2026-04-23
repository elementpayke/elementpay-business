"use client";

import { Loader2 } from "lucide-react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import type { VerificationTier } from "@/lib/verification/types";
import {
  VerificationTierStateBadge,
  VerificationTierVerifiedBadge,
} from "@/components/verification/VerificationBadges";
import VerificationProgressBar from "@/components/verification/VerificationProgressBar";

type VerificationTierSummaryCardProps = {
  tiers: VerificationTier[];
  startingTierId: number | null;
  onStartTier: (tier: VerificationTier) => void;
};

function TierAction({
  tier,
  starting,
  onStartTier,
}: {
  tier: VerificationTier;
  starting: boolean;
  onStartTier: (tier: VerificationTier) => void;
}) {
  if (tier.actionState === "verified") {
    return <VerificationTierVerifiedBadge />;
  }

  const disabled = tier.actionState === "locked" || starting;

  return (
    <div className="space-y-4">
      <span
        title={
          tier.actionState === "locked"
            ? "Complete the previous verification tier to unlock this flow."
            : undefined
        }
        className="block"
      >
        <button
          type="button"
          disabled={disabled}
          aria-disabled={disabled}
          onClick={() => onStartTier(tier)}
          className={mergeClasses(
            "inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition",
            tier.actionState === "available" &&
              "bg-[#F1F0FF] text-primary-600 hover:bg-primary-100",
            tier.actionState === "locked" &&
              "bg-[#EEEDF6] text-[#979DAF] disabled:cursor-not-allowed",
            starting && "gap-2",
          )}
        >
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {tier.actionLabel}
        </button>
      </span>
      <p className="rounded-xl border border-[#EEF0F6] bg-[#FAFBFE] px-3 py-3 text-xs leading-5 text-[#8A90A5]">
        {tier.helperText}
      </p>
    </div>
  );
}

export default function VerificationTierSummaryCard({
  tiers,
  startingTierId,
  onStartTier,
}: VerificationTierSummaryCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#ECEEF5] bg-white transition-shadow hover:shadow-[0_12px_32px_rgba(17,24,39,0.04)]">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {tiers.map((tier, index) => {
          const tone = tier.completed ? "complete" : tier.actionState === "locked" ? "locked" : "brand";

          return (
            <section
              key={tier.id}
              className={mergeClasses(
                "flex h-full flex-col gap-6 p-5 transition-colors hover:bg-[#FCFCFF] sm:p-6",
                index > 0 && "border-t border-[#ECEEF5]",
                index === 1 && "md:border-t-0 md:border-l",
                index === 2 && "md:col-span-2 xl:col-span-1",
                index === 2 && "xl:border-l md:border-t",
                index === 2 && "xl:border-t-0",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-[13px] font-semibold text-[#4E5468]">{tier.name}</p>
                  <h2
                    className={mergeClasses(
                      "text-[22px] font-semibold tracking-[-0.03em]",
                      tier.actionState === "locked" ? "text-[#8C92A7]" : "text-[#171D32]",
                    )}
                  >
                    {tier.title}
                  </h2>
                </div>
                <VerificationTierStateBadge tier={tier} />
              </div>

              <p
                className={mergeClasses(
                  "text-sm font-medium",
                  tier.completed ? "text-tertiary-600" : "text-[#757C91]",
                )}
              >
                Daily transaction limit: {tier.dailyLimit}
              </p>

              <VerificationProgressBar
                label={tier.progressLabel}
                tone={tone}
                value={tier.progress}
              />

              <TierAction
                tier={tier}
                starting={startingTierId === tier.id}
                onStartTier={onStartTier}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}
