import { NextRequest, NextResponse } from "next/server";

// Server-side fetch needs an absolute URL. We intentionally do NOT fall back to
// NEXT_PUBLIC_API_BASE_URL here because that's a relative rewrite path
// (`/backend`) that only works from the browser.
const BACKEND_URL = process.env.INTERNAL_BACKEND_URL ?? "";

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const upstream = `${BACKEND_URL.replace(/\/$/, "")}/internal/psp/noah/payin/virtual-account`;

  try {
    const response = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Enroll-Key": internalKey,
      },
      body: JSON.stringify(body),
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const payload = isJson ? await response.json().catch(() => ({})) : {};

    if (!response.ok) {
      const message =
        (typeof payload === "object" && payload && "message" in payload &&
          typeof (payload as { message: unknown }).message === "string"
          ? (payload as { message: string }).message
          : null) ??
        `Upstream request failed (${response.status})`;
      return NextResponse.json({ error: message, detail: payload }, { status: response.status });
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
