/**
 * Client ke JepangKu Core Backend.
 * Implementasi HTTP/gRPC menggantikan stub setelah tim menetapkan kontrak API.
 */

export function getCoreApiBaseUrl(): string | undefined {
    /** Prefer JEPANGKU_CORE_API_URL; CORE_API_URL is legacy alias from older compose files. */
    const coreApiUrl = process.env.JEPANGKU_CORE_API_URL ?? process.env.CORE_API_URL;
    return coreApiUrl?.replace(/\/$/, '');
}

export function isCoreApiConfigured(): boolean {
    return Boolean(getCoreApiBaseUrl());
}
