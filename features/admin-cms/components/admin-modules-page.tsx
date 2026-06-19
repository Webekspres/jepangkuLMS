'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import { deleteModuleAction } from '@/features/admin-cms/actions/cms-module-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    paginatedItems: paginatedModules,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(modules);

  const deleteTarget = modules.find((mod) => mod.id === deleteId);

  return (
    <AdminPageShell
      label={course.level}
      title={course.title}
      subtitle="Kelola modul (bab) dalam kursus ini. Setiap modul berisi satu atau lebih pelajaran."
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
        <span className="text-sm text-muted-foreground">{modules.length} modul</span>
      </div>

      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-xs uppercase tracking-wider">Urut</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Modul</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Pelajaran</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {modules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  Belum ada modul. Tambahkan modul pertama untuk mengisi pelajaran.
                </TableCell>
              </TableRow>
            ) : (
              paginatedModules.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell className="font-mono text-sm">{mod.order}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{mod.title}</p>
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
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="outline">
                        <Link href={ADMIN_ROUTES.kursusLessons(course.id, mod.id)}>
                          <BookOpen className="size-3.5" />
                          Pelajaran
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${ADMIN_ROUTES.kursusModuleForm(course.id)}?id=${mod.id}`}>
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(mod.id)}
                      >
                        <Trash2 className="size-3.5" />
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
          itemLabel="modul"
        />
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus modul?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" dan semua pelajaran di dalamnya akan dihapus.`
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
