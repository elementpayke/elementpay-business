import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.INTERNAL_BACKEND_URL ?? "";

export async function GET(request: NextRequest) {
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
          "Server misconfigured: INTERNAL_BACKEND_URL must be set to an absolute URL",
      },
      { status: 500 },
    );
  }

  const search = request.nextUrl.searchParams;
  const subjectType = search.get("subject_type");
  const subjectId = search.get("subject_id");
  const railKey = search.get("rail_key") ?? "noah";
  if (!subjectType || !subjectId) {
    return NextResponse.json(
      { error: "subject_type and subject_id are required" },
      { status: 422 },
    );
  }

  const base = BACKEND_URL.replace(/\/$/, "");
  const upstream = new URL(`${base}/internal/psp/enrollments`);
  upstream.searchParams.set("subject_type", subjectType);
  upstream.searchParams.set("subject_id", subjectId);
  upstream.searchParams.set("rail_key", railKey);

  try {
    const upstreamRes = await fetch(upstream.toString(), {
      method: "GET",
      headers: { "X-Internal-Enroll-Key": internalKey },
    });

    const isJson = upstreamRes.headers
      .get("content-type")
      ?.includes("application/json");
    const payload = isJson ? await upstreamRes.json().catch(() => ({})) : {};

    console.log("[noah-enrollment] lookup", {
      subjectType,
      subjectId,
      railKey,
      status: upstreamRes.status,
      payload,
    });

    return NextResponse.json(payload, { status: upstreamRes.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error("[noah-enrollment] network error", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
