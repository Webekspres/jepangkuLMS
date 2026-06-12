/** Aktifkan UI + sync Core (banner, /auth/complete). Default off sampai Core staging siap. */
export function isCoreIntegrationEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CORE_INTEGRATION_UI === 'true';
}
