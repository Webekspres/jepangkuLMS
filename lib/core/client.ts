/**
 * Client ke JepangKu Core Backend.
 * Implementasi HTTP/gRPC menggantikan stub setelah tim menetapkan kontrak API.
 */

/** Prefer JEPANGKU_CORE_API_URL; CORE_API_URL is legacy alias from older compose files. */
const CORE_API_URL =
    process.env.JEPANGKU_CORE_API_URL ?? process.env.CORE_API_URL;

export function getCoreApiBaseUrl(): string | undefined {
    return CORE_API_URL?.replace(/\/$/, '');
}

export function isCoreApiConfigured(): boolean {
    return Boolean(getCoreApiBaseUrl());
}
