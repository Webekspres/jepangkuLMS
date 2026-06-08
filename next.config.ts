import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
    ],
  },

  // 🚀 SOLUSI 1: Taruh di root config sesuai saran log terminal lo (Biar HMR Ngrok gak diblokir)
  allowedDevOrigins: ["walk-ravine-smuggler.ngrok-free.dev"],

  experimental: {
    // Biar Server Actions aman pas nerima kiriman form lewat Ngrok
    serverActions: {
      allowedOrigins: ["walk-ravine-smuggler.ngrok-free.dev"],
    },
  },
};

export default nextConfig;
