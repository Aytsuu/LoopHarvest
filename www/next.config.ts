import type { NextConfig } from "next";

const configuredDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const apiProxyTarget = (process.env.API_PROXY_TARGET ?? "http://localhost:8000").replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Allow mobile devices on the same LAN to load Next.js dev assets for hydration.
  allowedDevOrigins: [...new Set(["192.168.1.3", ...configuredDevOrigins])],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
