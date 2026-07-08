'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Pencil, Plus } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminSortableTableRoot, AdminSortableTableRows } from '@/features/admin-cms/components/admin-sortable-table';
import {
  AdminTableAction,
  AdminTableActionDelete,
  AdminTableActions,
} from '@/features/admin-cms/components/admin-table-actions';
import {
  deleteModuleAction,
  reorderModulesAction,
} from '@/features/admin-cms/actions/cms-module-actions';
import { formatModuleDisplayTitle } from '@/features/admin-cms/lib/curriculum-display';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type ModuleRow = {
  id: string;
  title: string;
  slug: string;
  order: number;
  description: string | null;
  lessonCount: number;
};

type AdminModulesPageProps = {
  course: {
    id: string;
    title: string;
    slug: string;
    level: string;
    isPublished: boolean;
  };
  modules: ModuleRow[];
};

export function AdminModulesPage({ course, modules }: AdminModulesPageProps) {
  const router = useRouter();
  const [localRows, setLocalRows] = useState<ModuleRow[] | null>(null);
  const rows = localRows ?? modules;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deleteTarget = rows.find((mod) => mod.id === deleteId);

  function handleReorder(orderedIds: string[]) {
    const next = orderedIds
      .map((id, index) => {
        const row = rows.find((item) => item.id === id);
        return row ? { ...row, order: index + 1 } : null;
      })
      .filter(Boolean) as ModuleRow[];
    setLocalRows(next);

    startTransition(async () => {
      const result = await reorderModulesAction(course.id, orderedIds);
      if (!result.ok) {
        toast.error(result.message ?? 'Gagal mengubah urutan modul.');
        setLocalRows(null);
        return;
      }
      toast.success('Urutan modul diperbarui');
      setLocalRows(null);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label={course.level}
      title={course.title}
      subtitle="Kelola modul (bab) dalam kursus ini. Seret baris untuk mengubah urutan."
      backHref={ADMIN_ROUTES.kursus}
      backLabel="Semua Kursus"
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`${ADMIN_ROUTES.kursusForm}?id=${course.id}`}>
              <Pencil className="size-4" />
              Edit Kursus
            </Link>
          </Button>
          <Button asChild>
            <Link href={ADMIN_ROUTES.kursusModuleForm(course.id)}>
              <Plus className="size-4" />
              Modul Baru
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{course.slug}</Badge>
        <Badge
          className={
            course.isPublished
              ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10'
              : 'bg-muted text-muted-foreground hover:bg-muted'
          }
        >
          {course.isPublished ? 'Published' : 'Draft'}
        </Badge>
        <span className="text-sm text-muted-foreground">{rows.length} modul</span>
      </div>

      <Card className="overflow-hidden border-border">
        {rows.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead className="text-xs uppercase tracking-wider">Modul</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Pelajaran</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  Belum ada modul. Tambahkan modul pertama untuk mengisi pelajaran.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <AdminSortableTableRoot
            items={rows}
            disabled={isPending}
            onReorder={handleReorder}
            renderRow={(mod, dragHandle) => (
              <>
                <TableCell>{dragHandle}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{formatModuleDisplayTitle(mod.order, mod.title)}</p>
                    <p className="text-xs text-muted-foreground">{mod.slug}</p>
                    {mod.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">{mod.description}</p>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {mod.lessonCount} pelajaran
                </TableCell>
                <TableCell>
                  <AdminTableActions>
                    <AdminTableAction
                      label="Kelola pelajaran"
                      icon={BookOpen}
                      href={ADMIN_ROUTES.kursusLessons(course.id, mod.id)}
                      showLabel
                    />
                    <AdminTableAction
                      label="Edit modul"
                      icon={Pencil}
                      href={`${ADMIN_ROUTES.kursusModuleForm(course.id)}?id=${mod.id}`}
                    />
                    <AdminTableActionDelete
                      label="Hapus modul"
                      onClick={() => setDeleteId(mod.id)}
                    />
                  </AdminTableActions>
                </TableCell>
              </>
            )}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="text-xs uppercase tracking-wider">Modul</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Pelajaran</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AdminSortableTableRows />
              </TableBody>
            </Table>
          </AdminSortableTableRoot>
        )}
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus modul?"
        description={
          deleteTarget
            ? `"${formatModuleDisplayTitle(deleteTarget.order, deleteTarget.title)}" dan semua pelajaran di dalamnya akan dihapus.`
            : 'Modul akan dihapus permanen.'
        }
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            await deleteModuleAction(course.id, deleteId);
            setDeleteId(null);
            router.refresh();
          });
        }}
      />
    </AdminPageShell>
  );
}
