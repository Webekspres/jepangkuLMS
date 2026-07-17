import { describe, expect, test } from 'bun:test';
import {
  buildLiveClassReminderIdempotencyKey,
  buildLiveClassReminderSubject,
} from '@/lib/email/send-live-class-reminder-email';
import {
  formatLiveClassReminderDateLabel,
  formatLiveClassReminderTimeRange,
} from '@/lib/lms/live-class-reminders';
import { getJakartaDateKey, getJakartaDayBounds } from '@/lib/jakarta-calendar';

describe('buildLiveClassReminderIdempotencyKey', () => {
  test('includes session, user, and jakarta date', () => {
    expect(
      buildLiveClassReminderIdempotencyKey({
        sessionId: 'sess-1',
        userId: 'user-1',
        jakartaDateKey: '2026-07-17',
      }),
    ).toBe('lms:live-class-reminder:sess-1:user-1:2026-07-17');
  });
});

describe('buildLiveClassReminderSubject', () => {
  test('includes live class title', () => {
    expect(buildLiveClassReminderSubject('N5 Conversation')).toBe(
      'Reminder Live Class hari ini — N5 Conversation',
    );
  });
});

describe('live class reminder formatting', () => {
  test('formats jakarta date label', () => {
    const date = new Date('2026-07-17T02:30:00+07:00');
    const label = formatLiveClassReminderDateLabel(date);
    expect(label).toContain('2026');
    expect(label.toLowerCase()).toContain('juli');
  });

  test('formats jakarta time range with WIB suffix', () => {
    const start = new Date('2026-07-17T19:00:00+07:00');
    const end = new Date('2026-07-17T21:00:00+07:00');
    const range = formatLiveClassReminderTimeRange(start, end);
    expect(range).toContain('WIB');
    expect(range).toContain('–');
  });
});

describe('jakarta day bounds for reminders', () => {
  test('midnight jakarta is inside same jakarta day', () => {
    const now = new Date('2026-07-17T00:00:00+07:00');
    const { start, end } = getJakartaDayBounds(now);
    expect(getJakartaDateKey(now)).toBe('2026-07-17');
    expect(now >= start && now <= end).toBe(true);
  });
});
