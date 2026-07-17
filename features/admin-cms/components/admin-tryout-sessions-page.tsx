'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Search, Target, Package } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminPesertaCell } from '@/features/admin-cms/components/admin-peserta-cell';
import { AdminStatusToggleButton } from '@/features/admin-cms/components/admin-status-toggle-button';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import {
  AdminTableAction,
  AdminTableActionDelete,
  AdminTableActions,
} from '@/features/admin-cms/components/admin-table-actions';
import {
  deleteTryoutSessionAction,
  toggleTryoutSessionActiveAction,
} from '@/features/admin-cms/actions/cms-tryout-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type { AdminTryoutSessionRow } from '@/features/admin-cms/lib/load-admin-tryout-sessions';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export function AdminTryoutSessionsPage({ sessions }: { sessions: AdminTryoutSessionRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.phaseLabel.toLowerCase().includes(q),
    );
  }, [sessions, query]);

  const {
    paginatedItems,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(filtered, { resetKey: query });

  const deleteTarget = sessions.find((row) => row.id === deleteId);

  function handleToggleActive(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleTryoutSessionActiveAction(id, !current);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(current ? 'Sesi dinonaktifkan' : 'Sesi diaktifkan');
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteTryoutSessionAction(deleteId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Sesi tryout dihapus');
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title="Kelola JLPT Tryout"
      subtitle="Sesi = jadwal ujian. Isi soal di Paket Soal, lalu pilih di sini."
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={ADMIN_ROUTES.tryoutPaket}>
              <Package className="size-4" />
              Paket Soal
            </Link>
          </Button>
          <Button asChild>
            <Link href={ADMIN_ROUTES.tryoutSessionForm}>
              <Plus className="size-4" />
              Sesi Baru
            </Link>
          </Button>
        </div>
      }
    >
      <Card className="overflow-hidden border-border">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul, kode, fase…"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} sesi</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sesi</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Paket</TableHead>
              <TableHead>Soal</TableHead>
              <TableHead>Durasi</TableHead>
              <TableHead>Peserta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  <Target className="mx-auto mb-2 size-8 opacity-40" />
                  Belum ada sesi tryout.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.title}</p>
                    {row.scheduledAt ? (
                      <p className="text-xs text-muted-foreground">
                        {new Date(row.scheduledAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.level}</Badge>
                  </TableCell>
                  <TableCell>
                    {row.questionSetTitle ? (
                      <p className="max-w-48 truncate text-sm">{row.questionSetTitle}</p>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{row.questionCount}</TableCell>
                  <TableCell>{row.timeLimitMinutes} mnt</TableCell>
                  <TableCell>
                    <AdminPesertaCell
                      type="TRYOUT"
                      productId={row.id}
                      programTitle={row.title}
                      activeCount={row.activeEnrollments}
                      pendingCount={row.pendingEnrollments}
                    />
                  </TableCell>
                  <TableCell>
                    <AdminStatusToggleButton
                      active={row.isActive}
                      activeLabel="Aktif"
                      inactiveLabel="Nonaktif"
                      activeHint="Klik nonaktifkan"
                      inactiveHint="Klik aktifkan"
                      disabled={isPending}
                      onClick={() => handleToggleActive(row.id, row.isActive)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminTableActions>
                      {row.questionSetId ? (
                        <AdminTableAction
                          label="Lihat paket"
                          icon={Package}
                          href={ADMIN_ROUTES.tryoutPaketDetail(row.questionSetId)}
                        />
                      ) : null}
                      <AdminTableAction
                        label="Edit sesi tryout"
                        icon={Pencil}
                        href={ADMIN_ROUTES.tryoutSessionFormEdit(row.id)}
                      />
                      <AdminTableActionDelete
                        label="Hapus sesi tryout"
                        disabled={isPending}
                        onClick={() => setDeleteId(row.id)}
                      />
                    </AdminTableActions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <AdminTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="sesi"
        />
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus sesi tryout?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" akan dihapus. Paket Soal & bank tetap aman.`
            : 'Sesi tryout akan dihapus permanen.'
        }
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        loading={isPending}
      />
    </AdminPageShell>
  );
}
