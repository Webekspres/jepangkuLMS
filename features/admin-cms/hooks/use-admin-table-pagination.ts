'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ADMIN_TABLE_DEFAULT_PAGE_SIZE,
  clampAdminTablePage,
  getAdminTablePageCount,
  sliceAdminTablePage,
  type AdminTablePageSize,
} from '@/features/admin-cms/lib/admin-table-pagination';

type UseAdminTablePaginationOptions = {
  defaultPageSize?: AdminTablePageSize;
  /** Ubah nilai ini (mis. query filter) untuk reset ke halaman 1. */
  resetKey?: string | number;
};

export function useAdminTablePagination<T>(
  items: T[],
  options: UseAdminTablePaginationOptions = {},
) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminTablePageSize>(
    options.defaultPageSize ?? ADMIN_TABLE_DEFAULT_PAGE_SIZE,
  );

  const totalItems = items.length;
  const totalPages = getAdminTablePageCount(totalItems, pageSize);
  const safePage = clampAdminTablePage(page, totalItems, pageSize);

  useEffect(() => {
    setPage(1);
  }, [options.resetKey]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const paginatedItems = useMemo(
    () => sliceAdminTablePage(items, safePage, pageSize),
    [items, safePage, pageSize],
  );

  const handlePageSizeChange = (nextPageSize: AdminTablePageSize) => {
    setPageSize(nextPageSize);
    setPage(1);
  };

  return {
    paginatedItems,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    setPage,
    setPageSize: handlePageSizeChange,
  };
}
