export type VerificationTabKey = "overview" | "tier-1" | "tier-2" | "tier-3";

export type VerificationTierId = 1 | 2 | 3;

export type VerificationRequirementStatus =
  | "completed"
  | "submitted"
  | "pending"
  | "incomplete"
  | "rejected"
  | "not-submitted"
  | "not-completed";

export type VerificationActionState = "verified" | "available" | "locked";

export interface VerificationRequirement {
  id: string;
  label: string;
  status: VerificationRequirementStatus;
}

export interface VerificationTier {
  id: VerificationTierId;
  key: Exclude<VerificationTabKey, "overview">;
  name: string;
  title: string;
  dailyLimit: string;
  unlocked: boolean;
  current: boolean;
  completed: boolean;
  progress: number;
  progressLabel: string;
  helperText: string;
  actionLabel: string;
  actionState: VerificationActionState;
  requirements: VerificationRequirement[];
}

export interface VerificationTab {
  key: VerificationTabKey;
  label: string;
}

export interface TransactionLimitMetric {
  label: string;
  value: string;
  muted?: boolean;
}

export interface VerificationLimitProfile {
  tierId: VerificationTierId;
  title: string;
  metrics: TransactionLimitMetric[];
}

export interface VerificationDashboardData {
  subtitle: string;
  tabs: VerificationTab[];
  tiers: VerificationTier[];
  limits: VerificationLimitProfile[];
}

export interface StartVerificationResponse {
  tierId: Exclude<VerificationTierId, 1>;
  nextTab: Exclude<VerificationTabKey, "overview">;
}
