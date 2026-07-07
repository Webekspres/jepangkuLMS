export type EmailConfig = {
  apiKey: string | undefined;
  from: string;
  appUrl: string;
  logoUrl: string;
  enabled: boolean;
};

/** Resend + sender — no secrets hardcoded. */
export function getEmailConfig(): EmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() || undefined;
  const from = process.env.EMAIL_FROM?.trim() || 'JepangKu <hello@jepangku.com>';
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || 'https://kursus.jepangku.com';
  const logoUrl = `${appUrl.replace(/\/$/, '')}/brand/logo-beta.png`;

  return {
    apiKey,
    from,
    appUrl: appUrl.replace(/\/$/, ''),
    logoUrl,
    enabled: Boolean(apiKey),
  };
}

export function isEmailEnabled(): boolean {
  return getEmailConfig().enabled;
}
