'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackAnalyticsPageView } from '@/lib/analytics/events';
import { getGaMeasurementId } from '@/lib/analytics/config';

export function AnalyticsPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!getGaMeasurementId()) return;
    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    trackAnalyticsPageView(path);
  }, [pathname, searchParams]);

  return null;
}
