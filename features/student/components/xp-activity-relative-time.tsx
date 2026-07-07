'use client';

import { useEffect, useState } from 'react';
import {
  formatStableActivityTime,
  formatXpActivityTime,
} from '@/lib/lms/xp-activity-types';

type XpActivityRelativeTimeProps = {
  date: Date | string;
};

/**
 * Renders stable absolute time on SSR/first paint, then switches to relative
 * copy after mount so server HTML matches client hydration.
 */
export function XpActivityRelativeTime({ date }: XpActivityRelativeTimeProps) {
  const [label, setLabel] = useState(() => formatStableActivityTime(date));

  useEffect(() => {
    const refresh = () => setLabel(formatXpActivityTime(date));
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(timer);
  }, [date]);

  return <span suppressHydrationWarning>{label}</span>;
}
