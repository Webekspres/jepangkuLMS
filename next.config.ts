import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
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
    ],
  },

  // 🚀 SOLUSI 1: Taruh di root config sesuai saran log terminal lo (Biar HMR Ngrok gak diblokir)
  allowedDevOrigins: ["walk-ravine-smuggler.ngrok-free.dev"],

  experimental: {
    optimizePackageImports: ['lucide-react', 'motion/react', '@vidstack/react'],
    // Biar Server Actions aman pas nerima kiriman form lewat Ngrok
    serverActions: {
      allowedOrigins: ["walk-ravine-smuggler.ngrok-free.dev"],
      bodySizeLimit: "2mb",
    },
  },

  async headers() {
    return [
      {
        source: '/api/student/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
          { key: 'Vary', value: 'Cookie' },
        ],
      },
      {
        source: '/api/auth/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
          { key: 'Vary', value: 'Cookie' },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
          { key: 'Vary', value: 'Cookie' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0, must-revalidate' },
          { key: 'Vary', value: 'Cookie' },
        ],
      },
    ];
  },
};

export default nextConfig;
