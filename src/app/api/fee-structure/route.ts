import type { NextRequest } from "next/server";

const UPSTREAM_API =
  process.env.BACKEND_UPSTREAM_URL || "https://api.elementpay.net/api/v1";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = searchParams.get("currency") || searchParams.get("token");
  const orderType = searchParams.get("q") || searchParams.get("action");

  if (!currency) {
    return Response.json(
      { error: "Missing required parameter: currency or token" },
      { status: 400 },
    );
  }

  const apiKey = process.env.NEXT_PRIVATE_AGGR_API_KEY;
  if (!apiKey) {
    console.error("[fee-structure] Missing NEXT_PRIVATE_AGGR_API_KEY");
    return Response.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const upstreamUrl = `${UPSTREAM_API}/fee-structure?currency=${encodeURIComponent(
    currency,
  )}${orderType ? `&q=${encodeURIComponent(orderType)}` : ""}`;

  try {
    const res = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (error) {
    console.error("[fee-structure] proxy error:", error);
    return Response.json(
      { error: "Failed to fetch fee structure" },
      { status: 502 },
    );
  }
}
