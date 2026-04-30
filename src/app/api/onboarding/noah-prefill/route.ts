import { NextRequest, NextResponse } from "next/server";

// Server-side fetch needs an absolute URL. We intentionally do NOT fall back to
// NEXT_PUBLIC_API_BASE_URL here because that's a relative rewrite path
// (`/backend`) that only works from the browser.
const BACKEND_URL = process.env.INTERNAL_BACKEND_URL ?? "";
const HOSTED_RETURN_URL = process.env.NOAH_HOSTED_ONBOARDING_RETURN_URL ?? "";

type PrefillRequestBody = {
  subject_id?: string;
  subject_type?: string;
  user_id?: number;
  rail_key?: string;
  noah_customer_id?: string;
  noah?: unknown;
};

function extractErrorMessage(payload: unknown, fallbackStatus: number): string {
  return (
    (typeof payload === "object" && payload && "message" in payload &&
      typeof (payload as { message: unknown }).message === "string"
      ? (payload as { message: string }).message
      : null) ?? `Upstream request failed (${fallbackStatus})`
  );
}

function getHostedReturnUrl(request: NextRequest): string {
  if (HOSTED_RETURN_URL && /^https:\/\//i.test(HOSTED_RETURN_URL)) {
    return HOSTED_RETURN_URL;
  }
  const origin = request.nextUrl.origin;
  if (/^https:\/\//i.test(origin)) {
    return `${origin.replace(/\/$/, "")}/onboarding`;
  }
  throw new Error(
    "NOAH_HOSTED_ONBOARDING_RETURN_URL must be set to an https URL for hosted onboarding",
  );
}

// Walk a payload looking for the canonical noah_customer_id. Backend may echo
// it directly, or wrap it under data/link/enrollment/etc. We accept any of:
// external_customer_id, noah_customer_id, NoahCustomerID.
function findExternalCustomerId(value: unknown, depth = 0): string | undefined {
  if (depth > 4 || !value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  for (const key of ["external_customer_id", "noah_customer_id", "NoahCustomerID"]) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object") {
      const found = findExternalCustomerId(v, depth + 1);
      if (found) return found;
    }
  }
  return undefined;
}

async function lookupEnrollmentCustomerId(
  base: string,
  internalKey: string,
  subjectType: string,
  subjectId: string,
): Promise<string | undefined> {
  const url = new URL(`${base}/internal/psp/enrollments`);
  url.searchParams.set("subject_type", subjectType);
  url.searchParams.set("subject_id", subjectId);
  url.searchParams.set("rail_key", "noah");
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "X-Internal-Enroll-Key": internalKey },
    });
    if (!res.ok) {
      console.log("[noah-prefill] post-prefill enrollment lookup non-OK", {
        status: res.status,
      });
      return undefined;
    }
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await res.json().catch(() => ({})) : {};
    const id = findExternalCustomerId(payload);
    console.log("[noah-prefill] post-prefill enrollment lookup", {
      status: res.status,
      foundId: id,
    });
    return id;
  } catch (err) {
    console.error("[noah-prefill] enrollment lookup failed", err);
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const internalKey = process.env.INTERNAL_API_KEY;
  if (!internalKey) {
    return NextResponse.json(
      { error: "Server misconfigured: INTERNAL_API_KEY missing" },
      { status: 500 },
    );
  }

  if (!BACKEND_URL || !/^https?:\/\//i.test(BACKEND_URL)) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured: INTERNAL_BACKEND_URL must be set to an absolute URL (e.g. https://api.elementpay.net/api/v1)",
      },
      { status: 500 },
    );
  }

  let body: PrefillRequestBody;
  try {
    body = (await request.json()) as PrefillRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.subject_id || !body.noah) {
    return NextResponse.json(
      { error: "subject_id and noah are required" },
      { status: 422 },
    );
  }

  const base = BACKEND_URL.replace(/\/$/, "");
  const prefillUpstream = `${base}/internal/psp/enrollments/noah/prefill-business`;
  const hostedUpstream = `${base}/internal/psp/enrollments/noah/hosted-onboarding`;

  const subjectType = body.subject_type ?? "organization";
  const prefillBody = { ...body, subject_type: subjectType };

  try {
    const prefillResponse = await fetch(prefillUpstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Enroll-Key": internalKey,
      },
      body: JSON.stringify(prefillBody),
    });

    const prefillIsJson = prefillResponse.headers
      .get("content-type")
      ?.includes("application/json");
    const prefillPayload = prefillIsJson ? await prefillResponse.json().catch(() => ({})) : {};

    if (!prefillResponse.ok) {
      const message = extractErrorMessage(prefillPayload, prefillResponse.status);
      return NextResponse.json(
        { error: message, detail: prefillPayload },
        { status: prefillResponse.status },
      );
    }

    // The canonical noah_customer_id is owned by the backend. After a
    // successful prefill the psp_customer_links row exists, so we can read
    // external_customer_id either from the prefill response (fast path) or
    // from /internal/psp/enrollments (authoritative path).
    const echoedId = findExternalCustomerId(prefillPayload);
    const lookedUpId = echoedId
      ? undefined
      : await lookupEnrollmentCustomerId(base, internalKey, subjectType, body.subject_id);
    const canonicalCustomerId = echoedId ?? lookedUpId;
    if (!canonicalCustomerId) {
      // Prefill claimed success but we cannot resolve a noah_customer_id.
      // Fail loudly rather than fabricate one — the frontend never invents ids.
      console.error("[noah-prefill] prefill succeeded but no noah_customer_id resolved", {
        prefillPayload,
      });
      return NextResponse.json(
        {
          error:
            "Backend did not return a noah_customer_id after prefill. Cannot start hosted onboarding.",
          detail: { prefill: prefillPayload },
        },
        { status: 502 },
      );
    }
    console.log("[noah-prefill] resolved canonical noah_customer_id", {
      canonical: canonicalCustomerId,
      source: echoedId ? "prefill-response" : "enrollment-lookup",
    });

    // Backend rule: user_id MUST be null when subject_type is organization.
    // Only forward user_id for user/individual subjects.
    const includeUserId =
      subjectType !== "organization" && typeof body.user_id === "number";
    const hostedBody = {
      subject_id: body.subject_id,
      subject_type: subjectType,
      rail_key: body.rail_key ?? "noah",
      noah_customer_id: canonicalCustomerId,
      return_url: getHostedReturnUrl(request),
      user_id: includeUserId ? body.user_id : null,
    };

    const hostedResponse = await fetch(hostedUpstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Enroll-Key": internalKey,
      },
      body: JSON.stringify(hostedBody),
    });

    const hostedIsJson = hostedResponse.headers
      .get("content-type")
      ?.includes("application/json");
    const hostedPayload = hostedIsJson ? await hostedResponse.json().catch(() => ({})) : {};

    if (!hostedResponse.ok) {
      const message = extractErrorMessage(hostedPayload, hostedResponse.status);
      return NextResponse.json(
        {
          error: message,
          detail: hostedPayload,
          prefill: prefillPayload,
        },
        { status: hostedResponse.status },
      );
    }

    const combined = {
      status: "success",
      message: "Noah prefill + hosted onboarding initialized",
      data: {
        prefill: prefillPayload,
        hosted: hostedPayload,
      },
    };

    return NextResponse.json(combined, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
