import { describe, expect, test } from 'bun:test';
import {
  clampAdminTablePage,
  getAdminTablePageCount,
  getAdminTableRowRange,
  sliceAdminTablePage,
} from '@/features/admin-cms/lib/admin-table-pagination';

describe('admin-table-pagination', () => {
  test('slices items for current page', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    expect(sliceAdminTablePage(items, 2, 5)).toEqual([6, 7, 8, 9, 10]);
  });

  test('clamps page when out of range', () => {
    expect(clampAdminTablePage(9, 12, 10)).toBe(2);
    expect(getAdminTablePageCount(12, 10)).toBe(2);
  });

  test('row range for display label', () => {
    expect(getAdminTableRowRange(2, 10, 25)).toEqual({ start: 11, end: 20 });
  });
});
