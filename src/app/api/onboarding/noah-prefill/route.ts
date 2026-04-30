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

  if (!body.subject_id || !body.noah_customer_id || !body.noah) {
    return NextResponse.json(
      { error: "subject_id, noah_customer_id and noah are required" },
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

    // Backend rule: user_id MUST be null when subject_type is organization.
    // Only forward user_id for user/individual subjects.
    const includeUserId =
      subjectType !== "organization" && typeof body.user_id === "number";
    const hostedBody = {
      subject_id: body.subject_id,
      subject_type: subjectType,
      rail_key: body.rail_key ?? "noah",
      noah_customer_id: body.noah_customer_id,
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
