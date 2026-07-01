import type { NextConfig } from "next";

/** Clerk script/frame origins — pk_test uses *.clerk.accounts.dev; prod custom domain uses clerk.jepangku.com */
const CLERK_CSP_ORIGINS = [
    "https://clerk.jepangku.com",
    "https://*.clerk.accounts.dev",
    "https://challenges.cloudflare.com",
].join(" ");

const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    /*
     * 'unsafe-eval' dan 'unsafe-inline' diperlukan oleh Next.js dan Clerk.
     * 'strict-dynamic' TIDAK bisa ditambahkan tanpa dukungan nonce penuh —
     * browser modern akan mengabaikan 'unsafe-inline' dan memblokir semua script.
     * Lihat SECURITY_AUDIT.md H-01 untuk rencana migrasi ke nonce-based CSP.
     */
    `script-src 'self' 'unsafe-eval' 'unsafe-inline' ${CLERK_CSP_ORIGINS}`,
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    `frame-src 'self' ${CLERK_CSP_ORIGINS} https://accounts.google.com`,
].join("; ");

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
                source: '/(.*)',
                headers: [
                    {
                        key: 'Content-Security-Policy',
                        value: CONTENT_SECURITY_POLICY,
                    },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                ],
            },
        ];
    },
};

export default nextConfig;
