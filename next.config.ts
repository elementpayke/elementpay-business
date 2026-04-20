import type { NextConfig } from "next";

const UPSTREAM_API = "https://api.elementpay.net/api/v1";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${UPSTREAM_API}/:path*`,
      },
    ];
  },
};

export default nextConfig;
