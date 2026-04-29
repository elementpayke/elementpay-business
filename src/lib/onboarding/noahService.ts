import { buildNoahPrefillPayload } from "@/lib/onboarding/noahPayload";
import type { BusinessDetails } from "@/lib/onboarding/types";

export interface SubmitNoahPrefillResult {
  ok: boolean;
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

export async function submitNoahPrefill(
  business: BusinessDetails,
): Promise<SubmitNoahPrefillResult> {
  const payload = buildNoahPrefillPayload(business);
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

  return { ok: true, data };
}
