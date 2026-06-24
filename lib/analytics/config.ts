/** Google Analytics 4 + Search Console env helpers. */

export function getGaMeasurementId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id && id !== 'G-XXXXXXXXXX' ? id : null;
}

export function getGscVerificationToken(): string | null {
  const token = process.env.NEXT_PUBLIC_GSC_VERIFICATION?.trim();
  return token && token !== 'YOUR_GSC_VERIFICATION_TOKEN' ? token : null;
}

export function getGaConsoleUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_GA_CONSOLE_URL?.trim();
  if (url) return url;
  return getGaMeasurementId() ? 'https://analytics.google.com/' : null;
}

export function getGscConsoleUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_GSC_CONSOLE_URL?.trim();
  return url || 'https://search.google.com/search-console';
}

export function isAnalyticsConfigured(): boolean {
  return Boolean(getGaMeasurementId());
}

export function isSearchConsoleConfigured(): boolean {
  return Boolean(getGscVerificationToken());
}
