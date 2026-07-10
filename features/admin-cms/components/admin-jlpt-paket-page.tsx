'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Archive,
  CheckCircle2,
  Copy,
  Lock,
  Package,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Upload,
} from 'lucide-react';
import {
  deleteJlptQuestionSetAction,
  duplicateJlptQuestionSetAction,
  setJlptQuestionSetStatusAction,
} from '@/features/admin-cms/actions/cms-jlpt-question-set-actions';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import {
  AdminTableAction,
  AdminTableActionDelete,
  AdminTableActions,
} from '@/features/admin-cms/components/admin-table-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type { AdminJlptQuestionSetRow } from '@/features/admin-cms/lib/load-admin-jlpt-question-sets';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

function statusBadge(status: string) {
  if (status === 'READY') return <Badge>READY</Badge>;
  if (status === 'ARCHIVED') return <Badge variant="outline">ARCHIVED</Badge>;
  return <Badge variant="secondary">DRAFT</Badge>;
}

export function AdminJlptPaketPage({ sets }: { sets: AdminJlptQuestionSetRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dupSource, setDupSource] = useState<AdminJlptQuestionSetRow | null>(null);
  const [dupCode, setDupCode] = useState('');
  const [dupTitle, setDupTitle] = useState('');
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sets;
    return sets.filter(
      (row) =>
        row.title.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.level.toLowerCase().includes(q),
    );
  }, [sets, query]);

  const { paginatedItems, page, pageSize, totalItems, setPage, setPageSize } =
    useAdminTablePagination(filtered, { resetKey: query });

  const deleteTarget = sets.find((row) => row.id === deleteId);

  function openDuplicate(row: AdminJlptQuestionSetRow) {
    setDupSource(row);
    setDupCode(`${row.code}-COPY`);
    setDupTitle(`${row.title} (salinan)`);
  }

  function handleDuplicate() {
    if (!dupSource) return;
    const formData = new FormData();
    formData.set('code', dupCode);
    formData.set('title', dupTitle);
    startTransition(async () => {
      const result = await duplicateJlptQuestionSetAction(dupSource.id, formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Paket diduplikasi');
      setDupSource(null);
      if (result.id) router.push(ADMIN_ROUTES.tryoutPaketDetail(result.id));
      else router.refresh();
    });
  }

  function handleStatus(id: string, status: 'DRAFT' | 'READY' | 'ARCHIVED') {
    startTransition(async () => {
      const result = await setJlptQuestionSetStatusAction(id, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Status → ${status}`);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteJlptQuestionSetAction(deleteId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Paket dihapus');
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title="Paket Soal JLPT"
      subtitle="Buat paket, isi soal di dalamnya, lalu pilih paket saat buat sesi."
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={ADMIN_ROUTES.tryoutPaketImport}>
              <Upload className="size-4" />
              Import ZIP
            </Link>
          </Button>
          <Button asChild>
            <Link href={ADMIN_ROUTES.tryoutPaketForm}>
              <Plus className="size-4" />
              Paket Baru
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
              placeholder="Cari judul, kode, level…"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">{filtered.length} paket</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paket</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Soal</TableHead>
              <TableHead>Bagian</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sesi aktif</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <Package className="mx-auto mb-2 size-8 opacity-40" />
                  Belum ada paket. Buat baru atau import ZIP.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      {row.stats.isContentLocked ? (
                        <Lock className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                      ) : null}
                      <div>
                        <p className="font-medium">{row.title}</p>
                        <code className="text-xs text-muted-foreground">{row.code}</code>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{row.level}</TableCell>
                  <TableCell>{row.stats.totalQuestions}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      M{row.stats.mojiCount} · B{row.stats.bunpouCount} · C{row.stats.chokaiCount}{' '}
                      ({row.stats.jlptCompleteness.label})
                    </span>
                  </TableCell>
                  <TableCell>{statusBadge(row.status)}</TableCell>
                  <TableCell>{row.stats.activeSessionCount}</TableCell>
                  <TableCell className="text-right">
                    <AdminTableActions>
                      <AdminTableAction
                        label="Edit paket"
                        icon={Pencil}
                        href={ADMIN_ROUTES.tryoutPaketDetail(row.id)}
                      />
                      <AdminTableAction
                        label="Duplikat"
                        icon={Copy}
                        onClick={() => openDuplicate(row)}
                      />
                      {row.status !== 'READY' ? (
                        <AdminTableAction
                          label="Set READY"
                          icon={CheckCircle2}
                          onClick={() => handleStatus(row.id, 'READY')}
                          disabled={isPending}
                        />
                      ) : null}
                      {row.status !== 'ARCHIVED' ? (
                        <AdminTableAction
                          label="Arsipkan"
                          icon={Archive}
                          onClick={() => handleStatus(row.id, 'ARCHIVED')}
                          disabled={isPending}
                        />
                      ) : (
                        <AdminTableAction
                          label="Jadikan DRAFT"
                          icon={RotateCcw}
                          onClick={() => handleStatus(row.id, 'DRAFT')}
                          disabled={isPending}
                        />
                      )}
                      <AdminTableActionDelete
                        label="Hapus paket"
                        disabled={isPending || row.stats.activeSessionCount > 0}
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
          itemLabel="paket"
        />
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus paket?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" akan dihapus. Soal di bank tetap aman.`
            : 'Paket akan dihapus permanen.'
        }
        confirmLabel="Hapus"
        onConfirm={handleDelete}
        loading={isPending}
      />

      <Dialog open={Boolean(dupSource)} onOpenChange={(open) => !open && setDupSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplikat Paket Soal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Masukkan kode unik baru (wajib dipilih admin — tidak di-auto-versi).
          </p>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="dup-code">Kode baru</Label>
              <Input
                id="dup-code"
                value={dupCode}
                onChange={(e) => setDupCode(e.target.value.toUpperCase())}
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dup-title">Judul</Label>
              <Input
                id="dup-title"
                value={dupTitle}
                onChange={(e) => setDupTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDupSource(null)}>
              Batal
            </Button>
            <Button disabled={isPending || !dupCode.trim()} onClick={handleDuplicate}>
              Duplikat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
