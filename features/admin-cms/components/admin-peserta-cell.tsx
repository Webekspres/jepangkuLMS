'use client';

import { useState } from 'react';
import type { EnrollmentType } from '@prisma/client';
import { ChevronRight, Users } from 'lucide-react';
import { AdminProgramEnrollmentsDialog } from '@/features/admin-cms/components/admin-program-enrollments-dialog';
import { cn } from '@/lib/utils';

type AdminPesertaCellProps = {
  type: EnrollmentType;
  productId: string;
  programTitle: string;
  activeCount: number;
  pendingCount: number;
  maxSlots?: number;
};

function formatPesertaLabel(
  activeCount: number,
  pendingCount: number,
  maxSlots?: number,
): string {
  if (maxSlots !== undefined) {
    return `${activeCount}/${maxSlots}`;
  }
  return String(activeCount);
}

export function AdminPesertaCell({
  type,
  productId,
  programTitle,
  activeCount,
  pendingCount,
  maxSlots,
}: AdminPesertaCellProps) {
  const [open, setOpen] = useState(false);
  const total = activeCount + pendingCount;
  const label = formatPesertaLabel(activeCount, pendingCount, maxSlots);
  const isEmpty = total === 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={isEmpty ? 'Belum ada pendaftar — klik untuk detail' : 'Klik untuk lihat daftar siswa'}
        className={cn(
          'group inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-left transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          isEmpty
            ? 'border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
            : 'border-primary/25 bg-primary/5 text-foreground hover:border-primary/50 hover:bg-primary/10',
        )}
      >
        <span
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded',
            isEmpty ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary',
          )}
        >
          <Users className="size-3.5" />
        </span>

        <span className="flex min-w-0 flex-col leading-tight">
          <span className="text-sm font-semibold tabular-nums">{label}</span>
          <span className="text-[10px] font-medium text-muted-foreground group-hover:text-primary/80">
            {isEmpty ? 'Belum ada' : 'Lihat daftar'}
          </span>
        </span>

        {pendingCount > 0 ? (
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ">
            +{pendingCount}
          </span>
        ) : null}

        <ChevronRight
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary',
            isEmpty && 'opacity-50',
          )}
        />
      </button>

      <AdminProgramEnrollmentsDialog
        open={open}
        onOpenChange={setOpen}
        type={type}
        productId={productId}
        programTitle={programTitle}
      />
    </>
  );
}
