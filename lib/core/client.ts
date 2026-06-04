/**
 * Client ke JepangKu Core Backend.
 * Implementasi HTTP/gRPC menggantikan stub setelah tim menetapkan kontrak API.
 */

const CORE_API_URL = process.env.JEPANGKU_CORE_API_URL;

export function getCoreApiBaseUrl(): string | undefined {
  return CORE_API_URL?.replace(/\/$/, '');
}

export function isCoreApiConfigured(): boolean {
  return Boolean(getCoreApiBaseUrl());
}
