import { describe, expect, test } from 'bun:test';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';

describe('landing-data', () => {
  test('formatDisplayNumber uses Indonesian locale grouping', () => {
    expect(formatDisplayNumber(32000)).toBe('32.000');
    expect(formatDisplayNumber(1000)).toBe('1.000');
  });
});
