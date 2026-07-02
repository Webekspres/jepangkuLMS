/** Resolve R2 env vars — supports legacy/alternate key names from infra docs. */
export function getR2Config() {
  return {
    accountId: process.env.R2_ACCOUNT_ID?.trim() ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim() ?? '',
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY?.trim() ??
      process.env.R2_ACCESS_KEY_SECRET?.trim() ??
      '',
    bucket:
      process.env.R2_BUCKET?.trim() ?? process.env.R2_BUCKET_NAME?.trim() ?? '',
    publicUrl:
      process.env.R2_PUBLIC_URL?.trim() ??
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim() ??
      '',
  };
}

export function isR2EnvConfigured(): boolean {
  const cfg = getR2Config();
  return Boolean(cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey && cfg.bucket);
}
