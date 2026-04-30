import { buildNoahPrefillPayload } from "@/lib/onboarding/noahPayload";
import type { BusinessDetails } from "@/lib/onboarding/types";

export interface SubmitNoahPrefillResult {
  ok: boolean;
  hostedUrl?: string;
  data?: unknown;
}

export class NoahPrefillError extends Error {
  status: number;
  detail?: unknown;
  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "NoahPrefillError";
    this.status = status;
    this.detail = detail;
  }
}

interface EnrollmentLookupRow {
  external_customer_id?: string;
  status?: string;
  last_error?: string | null;
  user_id?: number;
  subject_type?: string;
  subject_id?: string;
  rail_key?: string;
}

interface EnrollmentLookupEnvelope {
  status?: string;
  message?: string;
  data?: EnrollmentLookupRow;
}

async function fetchExistingNoahCustomerId(
  subjectId: string,
  subjectType: string,
): Promise<EnrollmentLookupRow | null> {
  const params = new URLSearchParams({
    subject_type: subjectType,
    subject_id: subjectId,
    rail_key: "noah",
  });
  const res = await fetch(`/api/onboarding/noah-enrollment?${params.toString()}`, {
    method: "GET",
  });
  if (res.status === 404) {
    console.log("[noah] no existing enrollment for", { subjectType, subjectId });
    return null;
  }
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => ({})) : {};
  console.log("[noah] enrollment lookup", { status: res.status, payload });
  if (!res.ok) return null;
  const envelope = payload as EnrollmentLookupEnvelope;
  return envelope.data ?? null;
}

function extractHostedUrl(data: unknown): string | undefined {
  if (typeof data !== "object" || !data) return undefined;
  // Backend may nest it under multiple envelope shapes.
  const d = data as Record<string, unknown>;
  if (typeof d["HostedURL"] === "string") return d["HostedURL"];
  if (typeof d["noah"] === "object" && d["noah"]) {
    const noah = d["noah"] as Record<string, unknown>;
    if (typeof noah["HostedURL"] === "string") return noah["HostedURL"];
  }
  if (typeof d["data"] === "object" && d["data"]) {
    const dataNode = d["data"] as Record<string, unknown>;
    if (typeof dataNode["HostedURL"] === "string") return dataNode["HostedURL"];
    if (typeof dataNode["noah"] === "object" && dataNode["noah"]) {
      const noah = dataNode["noah"] as Record<string, unknown>;
      if (typeof noah["HostedURL"] === "string") return noah["HostedURL"];
    }
    if (typeof dataNode["hosted"] === "object" && dataNode["hosted"]) {
      const hosted = dataNode["hosted"] as Record<string, unknown>;
      if (typeof hosted["HostedURL"] === "string") return hosted["HostedURL"];
      if (typeof hosted["data"] === "object" && hosted["data"]) {
        const hostedData = hosted["data"] as Record<string, unknown>;
        if (typeof hostedData["HostedURL"] === "string") return hostedData["HostedURL"];
        if (typeof hostedData["noah"] === "object" && hostedData["noah"]) {
          const hostedNoah = hostedData["noah"] as Record<string, unknown>;
          if (typeof hostedNoah["HostedURL"] === "string") return hostedNoah["HostedURL"];
        }
      }
      if (typeof hosted["noah"] === "object" && hosted["noah"]) {
        const hostedNoah = hosted["noah"] as Record<string, unknown>;
        if (typeof hostedNoah["HostedURL"] === "string") return hostedNoah["HostedURL"];
      }
    }
  }
  return undefined;
}

export async function submitNoahPrefill(
  business: BusinessDetails,
  userId: number | string,
): Promise<SubmitNoahPrefillResult> {
  const resolvedUserId = String(userId).trim();
  if (!resolvedUserId) {
    throw new NoahPrefillError("You must be signed in to start onboarding.", 401);
  }
  const subjectType = "organization";

  // Backend is the source of truth for noah_customer_id. The frontend never
  // generates one. If no psp_customer_links row exists yet, we send the
  // request without an id and let the backend create the row + assign the id.
  const existing = await fetchExistingNoahCustomerId(resolvedUserId, subjectType);
  const noahCustomerId = existing?.external_customer_id?.trim();
  if (noahCustomerId) {
    console.log("[noah] reusing existing noah_customer_id", {
      noahCustomerId,
      linkStatus: existing?.status,
      lastError: existing?.last_error,
    });
  } else {
    console.log("[noah] no existing noah_customer_id; backend will assign one");
  }

  // For business onboarding subject_type is "organization", and the backend
  // requires user_id to be null in that case. We pass subject_type explicitly
  // so the proxy enforces the rule, and we omit user_id here.
  const basePayload = buildNoahPrefillPayload(business, resolvedUserId, noahCustomerId);
  const payload = { ...basePayload, subject_type: subjectType };
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const res = await fetch("/api/onboarding/noah-prefill", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    const message =
      (typeof data === "object" && data && "error" in data &&
        typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : null) ?? `Could not save business details (${res.status}).`;
    throw new NoahPrefillError(message, res.status, data);
  }

  return { ok: true, hostedUrl: extractHostedUrl(data), data };
}
