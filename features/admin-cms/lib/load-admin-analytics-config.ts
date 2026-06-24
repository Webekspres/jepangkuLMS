import {
  getGaConsoleUrl,
  getGaMeasurementId,
  getGscConsoleUrl,
  isAnalyticsConfigured,
  isSearchConsoleConfigured,
} from '@/lib/analytics/config';

export type AdminAnalyticsConfig = {
  gaConfigured: boolean;
  gscConfigured: boolean;
  gaMeasurementId: string | null;
  gaConsoleUrl: string | null;
  gscConsoleUrl: string;
};

export function loadAdminAnalyticsConfig(): AdminAnalyticsConfig {
  return {
    gaConfigured: isAnalyticsConfigured(),
    gscConfigured: isSearchConsoleConfigured(),
    gaMeasurementId: getGaMeasurementId(),
    gaConsoleUrl: getGaConsoleUrl(),
    gscConsoleUrl: getGscConsoleUrl() ?? 'https://search.google.com/search-console',
  };
}
