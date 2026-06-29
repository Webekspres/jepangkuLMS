'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Search, Trash2, Video } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import {
  deleteLiveClassAction,
  toggleLiveClassPublishedAction,
} from '@/features/admin-cms/actions/cms-live-class-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type { AdminLiveClassRow } from '@/features/admin-cms/lib/load-admin-live-classes';
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

export function AdminLiveClassesPage({ classes }: { classes: AdminLiveClassRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.senseiName.toLowerCase().includes(q) ||
        row.category.toLowerCase().includes(q),
    );
  }, [classes, query]);

  const {
    paginatedItems,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(filtered, { resetKey: query });

  const deleteTarget = classes.find((row) => row.id === deleteId);

  function handleTogglePublished(id: string, current: boolean) {
    startTransition(async () => {
      const result = await toggleLiveClassPublishedAction(id, !current);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(current ? 'Live class disembunyikan' : 'Live class dipublikasikan');
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteLiveClassAction(deleteId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Live class dihapus');
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title="Kelola Live Class"
      subtitle="Jadwalkan sesi Zoom — tampil di dashboard siswa /dashboard/live-class."
      action={
        <Button asChild>
          <Link href={ADMIN_ROUTES.liveClassForm}>
            <Plus className="size-4" />
            Jadwalkan Kelas
          </Link>
        </Button>
      }
    >
      <Card className="overflow-hidden border-border">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari judul, sensei, kategori…"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} kelas</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Sensei</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Pertemuan</TableHead>
              <TableHead>Peserta</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <Video className="mx-auto mb-2 size-8 opacity-40" />
                  Belum ada live class.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.category}</p>
                  </TableCell>
                  <TableCell>{row.senseiName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{row.sessionCount} sesi</span>
                    {row.nextSessionAt ? (
                      <p className="text-xs">
                        {new Date(row.nextSessionAt).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    ) : (
                      <p className="text-xs">Belum dijadwalkan</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.filledSlots}/{row.maxSlots}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleTogglePublished(row.id, row.isPublished)}
                      className="inline-flex"
                    >
                      <Badge variant={row.isPublished ? 'default' : 'outline'}>
                        {row.isPublished ? 'Publik' : 'Draft'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={ADMIN_ROUTES.liveClassFormEdit(row.id)}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(row.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
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
          itemLabel="kelas"
        />
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus live class?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" akan dihapus permanen dari jadwal siswa.`
            : 'Live class akan dihapus permanen.'
        }
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        loading={isPending}
      />
    </AdminPageShell>
  );
}
