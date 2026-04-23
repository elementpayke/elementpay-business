"use client";

import { BadgeCheck, Lock } from "lucide-react";
import { mergeClasses } from "@/components/dashboard/DashboardPrimitives";
import type {
  VerificationRequirementStatus,
  VerificationTier,
} from "@/lib/verification/types";

function toSentenceCase(status: VerificationRequirementStatus) {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VerificationTierStateBadge({ tier }: { tier: VerificationTier }) {
  if (tier.current) {
    return (
      <span className="inline-flex items-center rounded-lg border border-secondary-200 bg-secondary-100/50 px-3 py-1 text-xs font-medium text-secondary-600">
        Current level
      </span>
    );
  }

  if (tier.actionState === "locked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4E7EF] bg-[#FAFBFE] px-3 py-1 text-xs font-medium text-[#7C8398]">
        <Lock className="h-3.5 w-3.5" />
        Locked
      </span>
    );
  }

  return null;
}

export function VerificationTierVerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-tertiary-200 bg-[#F3FBFA] px-4 py-2 text-sm font-semibold text-tertiary-600">
      <BadgeCheck className="h-4 w-4" />
      Verified
    </span>
  );
}

export function VerificationRequirementStatusText({
  status,
  align = "right",
}: {
  status: VerificationRequirementStatus;
  align?: "left" | "right";
}) {
  const styles: Record<VerificationRequirementStatus, string> = {
    completed: "text-[#0FA968]",
    submitted: "text-primary-600",
    pending: "text-[#D89B2F]",
    incomplete: "text-[#767E95]",
    rejected: "text-[#D95252]",
    "not-submitted": "text-[#767E95]",
    "not-completed": "text-[#767E95]",
  };

  return (
    <span
      className={mergeClasses(
        "text-sm font-medium",
        align === "right" ? "justify-self-end text-right" : "text-left",
        styles[status],
      )}
    >
      {toSentenceCase(status)}
    </span>
  );
}
