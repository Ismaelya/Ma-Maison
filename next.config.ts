import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Only set when an isolated dev instance opts in (e.g. CLAUDE_TEST_DISTDIR=.next-claude-test);
  // otherwise falls back to the default ".next", so this is a no-op for normal `next dev`/`next build`.
  ...(process.env.CLAUDE_TEST_DISTDIR ? { distDir: process.env.CLAUDE_TEST_DISTDIR } : {}),
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
};

export default withSentryConfig(nextConfig, {
  // Simplified Sentry options for maximum compatibility
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
});
