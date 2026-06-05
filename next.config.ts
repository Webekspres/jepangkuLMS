import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
