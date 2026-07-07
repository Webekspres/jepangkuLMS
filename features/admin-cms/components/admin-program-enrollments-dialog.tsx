'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { EnrollmentType } from '@prisma/client';
import { Check, ExternalLink, Loader2, Users } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import {
  AdminTableActionDelete,
  AdminTableActions,
} from '@/features/admin-cms/components/admin-table-actions';
import {
  approveEnrollmentAction,
  rejectEnrollmentAction,
} from '@/features/admin-cms/actions/cms-enrollment-actions';
import { loadProgramEnrollmentsAction } from '@/features/admin-cms/actions/cms-program-enrollment-actions';
import type { ProgramEnrollmentStudentRow } from '@/features/admin-cms/lib/load-admin-program-enrollments';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

const PROGRAM_TYPE_LABEL: Record<EnrollmentType, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'JLPT Tryout',
};

type AdminProgramEnrollmentsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: EnrollmentType;
  productId: string;
  programTitle: string;
};

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminProgramEnrollmentsDialog({
  open,
  onOpenChange,
  type,
  productId,
  programTitle,
}: AdminProgramEnrollmentsDialogProps) {
  const router = useRouter();
  const [rows, setRows] = useState<ProgramEnrollmentStudentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const rejectTarget = rows.find((row) => row.id === rejectId);
  const activeCount = rows.filter((row) => row.status === 'ACTIVE').length;
  const pendingCount = rows.filter((row) => row.status === 'PENDING').length;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadProgramEnrollmentsAction(type, productId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        setRows([]);
        return;
      }
      setRows(result.rows);
    });

    return () => {
      cancelled = true;
    };
  }, [open, type, productId]);

  function refreshRows() {
    void loadProgramEnrollmentsAction(type, productId).then((result) => {
      if (result.ok) setRows(result.rows);
      router.refresh();
    });
  }

  function handleApprove(enrollmentId: string) {
    startTransition(async () => {
      const result = await approveEnrollmentAction(enrollmentId);
      if (!result.ok) {
        toast.error(result.message ?? 'Gagal menyetujui enrollment.');
        return;
      }
      toast.success('Enrollment disetujui.');
      refreshRows();
    });
  }

  function handleRejectConfirm() {
    if (!rejectId) return;
    startTransition(async () => {
      const result = await rejectEnrollmentAction(rejectId);
      if (!result.ok) {
        toast.error(result.message ?? 'Gagal menghapus enrollment.');
        return;
      }
      toast.success('Enrollment dihapus.');
      setRejectId(null);
      refreshRows();
    });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="gap-0 overflow-hidden rounded-md p-0 sm:max-w-2xl **:data-[slot=dialog-close]:rounded-md">
          <DialogHeader className="space-y-3 border-b border-border bg-muted/30 px-5 py-4 pr-12">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Users className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <DialogTitle className="text-base font-bold">Daftar peserta</DialogTitle>
                <DialogDescription className="text-xs leading-relaxed">
                  <span className="font-medium text-foreground">{PROGRAM_TYPE_LABEL[type]}</span>
                  {' · '}
                  {programTitle}
                </DialogDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pl-12">
              <span className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium tabular-nums">
                <span className="text-muted-foreground">Aktif</span>
                <span className="ml-1.5 font-bold text-foreground">{activeCount}</span>
              </span>
              {pendingCount > 0 ? (
                <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium tabular-nums text-amber-700 dark:text-amber-400">
                  <span>Menunggu</span>
                  <span className="ml-1.5 font-bold">{pendingCount}</span>
                </span>
              ) : null}
              <span className="inline-flex items-center rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium tabular-nums text-muted-foreground">
                Total {rows.length}
              </span>
            </div>
          </DialogHeader>

          <div className="max-h-[min(55vh,28rem)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Memuat daftar siswa…
              </div>
            ) : error ? (
              <p className="px-5 py-14 text-center text-sm text-destructive">{error}</p>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
                <Users className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">Belum ada pendaftar</p>
                <p className="text-xs text-muted-foreground">
                  Siswa yang mendaftar akan muncul di sini setelah enrollment dibuat.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 pl-5 text-xs uppercase tracking-wider">Siswa</TableHead>
                    <TableHead className="h-10 text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="h-10 text-xs uppercase tracking-wider">Terdaftar</TableHead>
                    <TableHead className="h-10 pr-5 text-right text-xs uppercase tracking-wider">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="py-3 pl-5">
                        <p className="font-medium text-foreground">{row.displayName}</p>
                        <Link
                          href={ADMIN_ROUTES.userDetail(row.userId)}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Detail pengguna
                          <ExternalLink className="size-3" />
                        </Link>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge
                          variant={row.status === 'PENDING' ? 'secondary' : 'default'}
                          className="rounded-md"
                        >
                          {row.status === 'PENDING' ? 'Menunggu' : 'Aktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="py-3 pr-5 text-right">
                        {row.status === 'PENDING' ? (
                          <AdminTableActions>
                            <Button
                              size="sm"
                              className="h-8 gap-1 rounded-md"
                              disabled={isPending}
                              onClick={() => handleApprove(row.id)}
                            >
                              <Check className="size-3.5" />
                              Setujui
                            </Button>
                            <AdminTableActionDelete
                              label="Tolak enrollment"
                              disabled={isPending}
                              onClick={() => setRejectId(row.id)}
                            />
                          </AdminTableActions>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 rounded-md"
                            disabled={isPending}
                            onClick={() => setRejectId(row.id)}
                          >
                            Cabut akses
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={rejectId !== null}
        title={rejectTarget?.status === 'PENDING' ? 'Tolak enrollment?' : 'Cabut akses?'}
        description={
          rejectTarget
            ? rejectTarget.status === 'PENDING'
              ? `Hapus permintaan enrollment ${rejectTarget.displayName}?`
              : `Cabut akses ${rejectTarget.displayName} dari program ini?`
            : 'Hapus enrollment ini?'
        }
        confirmLabel={rejectTarget?.status === 'PENDING' ? 'Tolak' : 'Cabut akses'}
        onConfirm={handleRejectConfirm}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setRejectId(null);
        }}
        loading={isPending}
      />
    </>
  );
}
