import { mockVerificationDashboardData } from "@/lib/verification/mockData";
import type {
  StartVerificationResponse,
  VerificationActionState,
  VerificationDashboardData,
  VerificationLimitProfile,
  VerificationRequirement,
  VerificationRequirementStatus,
  VerificationTier,
  VerificationTierId,
} from "@/lib/verification/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

class VerificationApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "VerificationApiError";
    this.status = status;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseJson<T>(res: Response): Promise<T> {
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => ({})) : {};

  if (!res.ok) {
    const detail =
      (typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : null) ||
      (typeof body === "object" && body !== null && "detail" in body && typeof body.detail === "string"
        ? body.detail
        : null) ||
      `Request failed (${res.status})`;
    throw new VerificationApiError(detail, res.status);
  }

  return body as T;
}

function delay<T>(value: T, durationMs = 450): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), durationMs);
  });
}

function unwrapData<T>(payload: { data?: T } | T): T {
  if (payload && typeof payload === "object" && "data" in payload && payload.data) {
    return payload.data;
  }
  return payload as T;
}

function normalizeRequirementStatus(value: unknown): VerificationRequirementStatus {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

  if (
    normalized === "completed" ||
    normalized === "submitted" ||
    normalized === "pending" ||
    normalized === "incomplete" ||
    normalized === "rejected" ||
    normalized === "not-submitted" ||
    normalized === "not-completed"
  ) {
    return normalized;
  }

  return "pending";
}

function normalizeRequirement(item: unknown, index: number): VerificationRequirement {
  const record = typeof item === "object" && item !== null ? item : {};
  const label =
    ("label" in record && typeof record.label === "string" && record.label) ||
    ("name" in record && typeof record.name === "string" && record.name) ||
    `Requirement ${index + 1}`;

  const id =
    ("id" in record && typeof record.id === "string" && record.id) ||
    label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    label,
    status: normalizeRequirementStatus("status" in record ? record.status : ""),
  };
}

function normalizeActionState(
  value: unknown,
  completed: boolean,
  unlocked: boolean,
): VerificationActionState {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "verified" || normalized === "available" || normalized === "locked") {
    return normalized;
  }

  if (completed) return "verified";
  if (!unlocked) return "locked";
  return "available";
}

function normalizeTier(item: unknown): VerificationTier {
  const record = typeof item === "object" && item !== null ? item : {};
  const id = Number("id" in record ? record.id : 1) as VerificationTierId;
  const unlocked = Boolean("unlocked" in record ? record.unlocked : false);
  const completed = Boolean("completed" in record ? record.completed : false);
  const title =
    ("title" in record && typeof record.title === "string" && record.title) || "Verification tier";

  const progress = Math.max(
    0,
    Math.min(100, Number("progress" in record ? record.progress : completed ? 100 : 0) || 0),
  );

  const requirementsSource =
    "requirements" in record && Array.isArray(record.requirements) ? record.requirements : [];

  return {
    id,
    key: `tier-${id}` as VerificationTier["key"],
    name:
      ("name" in record && typeof record.name === "string" && record.name) ||
      `Tier ${id}`,
    title,
    dailyLimit:
      ("dailyLimit" in record && typeof record.dailyLimit === "string" && record.dailyLimit) ||
      ("daily_limit" in record && typeof record.daily_limit === "string" && record.daily_limit) ||
      "Unavailable",
    unlocked,
    current: Boolean("current" in record ? record.current : false),
    completed,
    progress,
    progressLabel:
      ("progressLabel" in record && typeof record.progressLabel === "string" && record.progressLabel) ||
      ("progress_label" in record && typeof record.progress_label === "string" && record.progress_label) ||
      (progress === 0 ? "Not started" : `${progress}% completed`),
    helperText:
      ("helperText" in record && typeof record.helperText === "string" && record.helperText) ||
      ("helper_text" in record && typeof record.helper_text === "string" && record.helper_text) ||
      "",
    actionLabel:
      ("actionLabel" in record && typeof record.actionLabel === "string" && record.actionLabel) ||
      ("action_label" in record && typeof record.action_label === "string" && record.action_label) ||
      (completed ? "Verified" : `Complete Tier ${id} verification`),
    actionState: normalizeActionState(
      "actionState" in record ? record.actionState : "action_state" in record ? record.action_state : "",
      completed,
      unlocked,
    ),
    requirements: requirementsSource.map(normalizeRequirement),
  };
}

function normalizeLimitProfile(item: unknown): VerificationLimitProfile {
  const record = typeof item === "object" && item !== null ? item : {};
  const metricsSource = "metrics" in record && Array.isArray(record.metrics) ? record.metrics : [];

  return {
    tierId: Number("tierId" in record ? record.tierId : "tier_id" in record ? record.tier_id : 1) as VerificationTierId,
    title:
      ("title" in record && typeof record.title === "string" && record.title) || "Current transaction limits",
    metrics: metricsSource.map((metric) => {
      const metricRecord = typeof metric === "object" && metric !== null ? metric : {};
      return {
        label:
          ("label" in metricRecord && typeof metricRecord.label === "string" && metricRecord.label) ||
          "Metric",
        value:
          ("value" in metricRecord && typeof metricRecord.value === "string" && metricRecord.value) ||
          "Unavailable",
        muted: Boolean("muted" in metricRecord ? metricRecord.muted : false),
      };
    }),
  };
}

function shouldFallbackToMock(error: unknown) {
  return error instanceof VerificationApiError && (error.status === 404 || error.status === 405 || error.status === 501);
}

export async function getVerificationDashboardData(): Promise<VerificationDashboardData> {
  if (!API_BASE) {
    return delay(mockVerificationDashboardData);
  }

  try {
    const [statusResponse, limitsResponse] = await Promise.all([
      fetch(`${API_BASE}/verification/status`, {
        headers: getAuthHeaders(),
      }),
      fetch(`${API_BASE}/verification/limits`, {
        headers: getAuthHeaders(),
      }),
    ]);

    const [statusPayload, limitsPayload] = await Promise.all([
      parseJson<unknown>(statusResponse),
      parseJson<unknown>(limitsResponse),
    ]);

    const statusData = unwrapData(statusPayload) as {
      subtitle?: string;
      tabs?: VerificationDashboardData["tabs"];
      tiers?: unknown[];
    };
    const limitsData = unwrapData(limitsPayload) as unknown[] | { limits?: unknown[] };

    const tiers = Array.isArray(statusData?.tiers) ? statusData.tiers.map(normalizeTier) : [];
    const limitItems = Array.isArray(limitsData)
      ? limitsData
      : Array.isArray(limitsData?.limits)
        ? limitsData.limits
        : [];

    if (tiers.length === 0 || limitItems.length === 0) {
      return delay(mockVerificationDashboardData, 250);
    }

    return {
      subtitle:
        typeof statusData.subtitle === "string"
          ? statusData.subtitle
          : mockVerificationDashboardData.subtitle,
      tabs:
        Array.isArray(statusData.tabs) && statusData.tabs.length > 0
          ? statusData.tabs
          : mockVerificationDashboardData.tabs,
      tiers,
      limits: limitItems.map(normalizeLimitProfile),
    };
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return delay(mockVerificationDashboardData, 250);
    }
    throw error;
  }
}

export async function startVerificationTier(
  tierId: Exclude<VerificationTierId, 1>,
): Promise<StartVerificationResponse> {
  if (!API_BASE) {
    return delay({ tierId, nextTab: `tier-${tierId}` as StartVerificationResponse["nextTab"] }, 250);
  }

  try {
    const response = await fetch(`${API_BASE}/verification/tier/${tierId}/start`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    await parseJson<unknown>(response);

    return {
      tierId,
      nextTab: `tier-${tierId}` as StartVerificationResponse["nextTab"],
    };
  } catch (error) {
    if (shouldFallbackToMock(error)) {
      return delay({ tierId, nextTab: `tier-${tierId}` as StartVerificationResponse["nextTab"] }, 250);
    }
    throw error;
  }
}
