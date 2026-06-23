'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  ADMIN_TABLE_PAGE_SIZE_OPTIONS,
  getAdminTableRowRange,
  type AdminTablePageSize,
} from '@/features/admin-cms/lib/admin-table-pagination';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AdminTablePaginationProps = {
  page: number;
  pageSize: AdminTablePageSize;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: AdminTablePageSize) => void;
  itemLabel?: string;
  className?: string;
};

export function AdminTablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'data',
  className,
}: AdminTablePaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const { start, end } = getAdminTableRowRange(page, pageSize, totalItems);

  return (
    <div
      className={`flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ''}`}
    >
      <p className="text-sm text-muted-foreground">
        Menampilkan {start}–{end} dari {totalItems} {itemLabel}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Tampilkan</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value) as AdminTablePageSize)}
          >
            <SelectTrigger size="sm" className="w-[72px]" aria-label="Jumlah baris per halaman">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ADMIN_TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[4.5rem] text-center text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
