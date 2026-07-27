import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  eslint: {
    // Les warnings ESLint ne bloquent pas le build Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Les erreurs TS ne bloquent pas le build Vercel (corrigées en CI)
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
