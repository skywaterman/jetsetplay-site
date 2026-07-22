import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        destination: "/api/proposal",
        source: "/.netlify/functions/claude",
      },
    ];
  },
};

export default nextConfig;
