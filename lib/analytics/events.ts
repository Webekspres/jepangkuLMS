import { getGaMeasurementId } from './config';

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackAnalyticsEvent(eventName: string, params?: AnalyticsEventParams): void {
  if (typeof window === 'undefined' || !getGaMeasurementId()) return;
  window.gtag?.('event', eventName, params);
}

export function trackAnalyticsPageView(path: string): void {
  if (typeof window === 'undefined' || !getGaMeasurementId()) return;
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
