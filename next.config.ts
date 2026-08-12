import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/** Clerk script/frame origins — pk_test uses *.clerk.accounts.dev; prod custom domain uses clerk.jepangku.com */
const CLERK_CSP_ORIGINS = [
  "https://clerk.jepangku.com",
  "https://*.clerk.accounts.dev",
  "https://challenges.cloudflare.com",
  "https://static.cloudflareinsights.com",
].join(" ");

/** Midtrans Snap.js + payment iframe (sandbox + production) */
const MIDTRANS_CSP_ORIGINS = [
  "https://app.sandbox.midtrans.com",
  "https://app.midtrans.com",
].join(" ");

/** Origins allowed to be framed inside the app (Clerk auth widgets, Google OAuth, embedded video, Midtrans Snap) */
const FRAME_SRC_ORIGINS = [
  "https://clerk.jepangku.com",
  "https://*.clerk.accounts.dev",
  "https://clerk.shared.lcl.dev",
  "https://challenges.cloudflare.com",
  "https://accounts.google.com",
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  MIDTRANS_CSP_ORIGINS,
].join(" ");

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  /*
   * 'unsafe-eval' dan 'unsafe-inline' diperlukan oleh Next.js dan Clerk.
   * 'strict-dynamic' TIDAK bisa ditambahkan tanpa dukungan nonce penuh —
   * browser modern akan mengabaikan 'unsafe-inline' dan memblokir semua script.
   * Lihat SECURITY_AUDIT.md H-01 untuk rencana migrasi ke nonce-based CSP.
   */
  `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com ${CLERK_CSP_ORIGINS} ${MIDTRANS_CSP_ORIGINS}`,
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  `frame-src 'self' ${FRAME_SRC_ORIGINS}`,
].join("; ");

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prefer http://localhost:3000 for Clerk OAuth (matches Dashboard paths).
  // LAN hostname only for asset/HMR when opening the Network URL during next dev.
  allowedDevOrigins: ["127.0.0.1"],
  experimental: {
    serverActions: {
      // App allows 2 MB uploads; leave headroom for multipart boundaries/metadata.
      bodySizeLimit: "3mb",
    },
  },
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "thread-stream",
    "real-require",
  ],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/pg/**/*",
      "./node_modules/@prisma/adapter-pg/**/*",
      "./node_modules/postgres-array/**/*",
      "./node_modules/postgres-bytea/**/*",
      "./node_modules/postgres-date/**/*",
      "./node_modules/postgres-interval/**/*",
      "./node_modules/pg-pool/**/*",
      "./node_modules/pg-connection-string/**/*",
      "./node_modules/pg-protocol/**/*",
      "./node_modules/pg-types/**/*",
      "./node_modules/pgpass/**/*",
      "./node_modules/split2/**/*",
      "./node_modules/xtend/**/*",
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "assets.jepangku.com",
        pathname: "/**",
      },
    ],
  },

  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: CONTENT_SECURITY_POLICY,
      },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          'camera=(), microphone=(), geolocation=(), clipboard-write=(self "https://www.youtube-nocookie.com" "https://www.youtube.com")',
      },
    ];

    // HSTS on localhost breaks OAuth return (browser upgrades http://localhost → https://).
    // Only emit in production builds.
    if (isProd) {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/api/student/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
      {
        source: "/api/auth/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "Vary", value: "Cookie" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
