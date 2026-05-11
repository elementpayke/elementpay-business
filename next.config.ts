import type { NextConfig } from "next";

function normalizeUpstreamUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  try {
    new URL(trimmed);
  } catch {
    throw new Error(
      `BUSINESS_API_UPSTREAM_URL must be an absolute URL. Received: ${value}`,
    );
  }
  return trimmed;
}

const BUSINESS_API_UPSTREAM_URL = normalizeUpstreamUrl(
  process.env.BUSINESS_API_UPSTREAM_URL ||
    "https://dev-mboka-api.elementpay.net",
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${BUSINESS_API_UPSTREAM_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
