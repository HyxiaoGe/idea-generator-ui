import type { NextConfig } from "next";

const BACKEND_API_URL = process.env.API_BASE_URL || "http://localhost:8888/api";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8888",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the backend.
        // Next.js file-based API routes (/api/auth/callback, /api/auth/refresh)
        // take priority and are NOT proxied.
        source: "/api/:path*",
        destination: `${BACKEND_API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
