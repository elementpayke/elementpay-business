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

const ANON_SUBJECT_ID_KEY = "onboarding:noah:subject-id";

function makeUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateAnonSubjectId(): string {
  if (typeof window === "undefined") return makeUuid();
  const existing = window.localStorage.getItem(ANON_SUBJECT_ID_KEY);
  if (existing) return existing;
  const created = makeUuid();
  window.localStorage.setItem(ANON_SUBJECT_ID_KEY, created);
  return created;
}

function getOrCreateNoahCustomerId(subjectId: string): string {
  if (typeof window === "undefined") return makeUuid();
  const key = `onboarding:noah:customer-id:${subjectId}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = makeUuid();
  window.localStorage.setItem(key, created);
  return created;
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
  subjectId?: string,
): Promise<SubmitNoahPrefillResult> {
  const resolvedSubjectId = subjectId?.trim() || getOrCreateAnonSubjectId();
  const noahCustomerId = getOrCreateNoahCustomerId(resolvedSubjectId);
  const payload = buildNoahPrefillPayload(business, resolvedSubjectId, noahCustomerId);
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
