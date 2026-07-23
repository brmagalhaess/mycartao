import type { NextConfig } from "next";

/**
 * Browser calls same-origin `/api/*`.
 * Next.js proxies to the FastAPI container (INTERNAL_API_URL).
 * This prevents localhost:8000 in the client bundle (mobile permission prompts).
 */
const internalApi = (
  process.env.INTERNAL_API_URL || "http://backend:8000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${internalApi}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
