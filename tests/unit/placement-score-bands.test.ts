import { describe, expect, test } from 'bun:test';
import { resolvePlacementLevel } from '@/features/placement/data/placement-score-bands';

describe('resolvePlacementLevel', () => {
  test('maps low scores to N5', () => {
    expect(resolvePlacementLevel(0).level).toBe('N5');
    expect(resolvePlacementLevel(40).level).toBe('N5');
    expect(resolvePlacementLevel(50).level).toBe('N5');
    expect(resolvePlacementLevel(64).level).toBe('N5');
  });

  test('maps high scores to N4 (not N2/N1)', () => {
    expect(resolvePlacementLevel(65).level).toBe('N4');
    expect(resolvePlacementLevel(86).level).toBe('N4');
    expect(resolvePlacementLevel(100).level).toBe('N4');
  });

  test('clamps out-of-range percents', () => {
    expect(resolvePlacementLevel(-10).level).toBe('N5');
    expect(resolvePlacementLevel(150).level).toBe('N4');
  });
});
