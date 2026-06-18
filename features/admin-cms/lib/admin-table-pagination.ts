/** Opsi ukuran halaman standar untuk tabel Admin CMS. */
export const ADMIN_TABLE_PAGE_SIZE_OPTIONS = [5, 10, 15, 25, 100] as const;

export type AdminTablePageSize = (typeof ADMIN_TABLE_PAGE_SIZE_OPTIONS)[number];

export const ADMIN_TABLE_DEFAULT_PAGE_SIZE: AdminTablePageSize = 10;

export function getAdminTablePageCount(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function clampAdminTablePage(page: number, totalItems: number, pageSize: number): number {
  return Math.min(Math.max(1, page), getAdminTablePageCount(totalItems, pageSize));
}

export function sliceAdminTablePage<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = clampAdminTablePage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function getAdminTableRowRange(
  page: number,
  pageSize: number,
  totalItems: number,
): { start: number; end: number } {
  if (totalItems === 0) return { start: 0, end: 0 };
  const safePage = clampAdminTablePage(page, totalItems, pageSize);
  const start = (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, totalItems);
  return { start, end };
}
