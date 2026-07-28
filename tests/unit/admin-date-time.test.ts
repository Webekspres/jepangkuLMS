import { describe, expect, test } from 'bun:test';
import {
  formatJakartaDateTimeInput,
  parseJakartaDateTimeInput,
  replaceDatePart,
  replaceTimePart,
} from '@/features/admin-cms/lib/admin-date-time';

describe('admin date time helpers', () => {
  test('parses jakarta local input into a stable date', () => {
    expect(parseJakartaDateTimeInput('2026-07-28T09:02')?.toISOString()).toBe(
      '2026-07-28T02:02:00.000Z',
    );
  });

  test('formats stored date back into jakarta input string', () => {
    expect(formatJakartaDateTimeInput(new Date('2026-07-28T02:02:00.000Z'))).toBe(
      '2026-07-28T09:02',
    );
  });

  test('replaces date or time parts without dropping the other half', () => {
    expect(replaceDatePart('2026-07-28T09:02', new Date('2026-07-30T00:00:00.000Z'))).toBe(
      '2026-07-30T09:02',
    );
    expect(replaceTimePart('2026-07-28T09:02', '13:45')).toBe('2026-07-28T13:45');
  });
});
