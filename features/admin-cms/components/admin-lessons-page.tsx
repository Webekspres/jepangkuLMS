'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LessonType } from '@prisma/client';
import { ExternalLink, Pencil, Plus } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminSortableTableRoot, AdminSortableTableRows } from '@/features/admin-cms/components/admin-sortable-table';
import {
  AdminTableAction,
  AdminTableActionDelete,
  AdminTableActions,
} from '@/features/admin-cms/components/admin-table-actions';
import {
  deleteLessonAction,
  reorderLessonsAction,
} from '@/features/admin-cms/actions/cms-lesson-actions';
import {
  formatLessonDisplayTitle,
  formatModuleDisplayTitle,
} from '@/features/admin-cms/lib/curriculum-display';
import { getLessonTypeDefinition } from '@/features/learning/lib/lesson-type-registry';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

type LessonRow = {
  id: string;
  title: string;
  slug: string;
  order: number;
  lessonType: LessonType | null;
  videoUrl: string | null;
  materialCount: number;
  quizCount: number;
};

type AdminLessonsPageProps = {
  course: { id: string; title: string; slug: string };
  module: { id: string; title: string; slug: string; order: number };
  lessons: LessonRow[];
};

export function AdminLessonsPage({ course, module, lessons }: AdminLessonsPageProps) {
  const router = useRouter();
  const [localRows, setLocalRows] = useState<LessonRow[] | null>(null);
  const rows = localRows ?? lessons;
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const deleteTarget = rows.find((lesson) => lesson.id === deleteId);

  function handleReorder(orderedIds: string[]) {
    const next = orderedIds
      .map((id, index) => {
        const row = rows.find((item) => item.id === id);
        return row ? { ...row, order: index + 1 } : null;
      })
      .filter(Boolean) as LessonRow[];
    setLocalRows(next);

    startTransition(async () => {
      const result = await reorderLessonsAction(course.id, module.id, orderedIds);
      if (!result.ok) {
        toast.error(result.message ?? 'Gagal mengubah urutan pelajaran.');
        setLocalRows(null);
        return;
      }
      toast.success('Urutan pelajaran diperbarui');
      setLocalRows(null);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label={course.title}
      title={formatModuleDisplayTitle(module.order, module.title)}
      subtitle="Kelola pelajaran dalam modul ini. Seret baris untuk mengubah urutan."
      backHref={ADMIN_ROUTES.kursusModules(course.id)}
      backLabel="Semua Modul"
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`${ADMIN_ROUTES.kursusModuleForm(course.id)}?id=${module.id}`}>
              <Pencil className="size-4" />
              Edit Modul
            </Link>
          </Button>
          <Button asChild>
            <Link href={ADMIN_ROUTES.kursusLessonForm(course.id, module.id)}>
              <Plus className="size-4" />
              Pelajaran Baru
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">Modul {module.order}</Badge>
        <span>{rows.length} pelajaran</span>
      </div>

      <Card className="overflow-hidden border-border">
        {rows.length === 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead className="text-xs uppercase tracking-wider">Pelajaran</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">Konten</TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  Belum ada pelajaran di modul ini.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        ) : (
          <AdminSortableTableRoot
            items={rows}
            disabled={isPending}
            onReorder={handleReorder}
            renderRow={(lesson, dragHandle) => (
              <>
                <TableCell>{dragHandle}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {formatLessonDisplayTitle(lesson.order, lesson.title)}
                    </p>
                    <p className="text-xs text-muted-foreground">{lesson.slug}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={lesson.lessonType ? 'outline' : 'secondary'} className="text-xs">
                      {getLessonTypeDefinition(lesson.lessonType).label}
                    </Badge>
                    {lesson.videoUrl ? (
                      <Badge variant="outline" className="text-xs">
                        Video
                      </Badge>
                    ) : null}
                    {lesson.materialCount > 0 ? (
                      <Badge variant="outline" className="text-xs">
                        {lesson.materialCount} materi
                      </Badge>
                    ) : null}
                    {lesson.quizCount > 0 ? (
                      <Badge variant="outline" className="text-xs">
                        {lesson.quizCount} soal
                      </Badge>
                    ) : null}
                    {!lesson.videoUrl && lesson.materialCount === 0 && lesson.quizCount === 0 ? (
                      <span className="text-xs text-muted-foreground">Kosong</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <AdminTableActions>
                    <AdminTableAction
                      label="Pratinjau pelajaran"
                      icon={ExternalLink}
                      href={`/dashboard/belajar/${course.slug}/${lesson.slug}`}
                      external
                    />
                    <AdminTableAction
                      label="Edit pelajaran"
                      icon={Pencil}
                      href={`${ADMIN_ROUTES.kursusLessonForm(course.id, module.id)}?id=${lesson.id}`}
                    />
                    <AdminTableActionDelete
                      label="Hapus pelajaran"
                      onClick={() => setDeleteId(lesson.id)}
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
                  <TableHead className="text-xs uppercase tracking-wider">Pelajaran</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider">Konten</TableHead>
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
        title="Hapus pelajaran?"
        description={
          deleteTarget
            ? `"${formatLessonDisplayTitle(deleteTarget.order, deleteTarget.title)}" beserta materi dan soal terkait akan dihapus.`
            : 'Pelajaran akan dihapus permanen.'
        }
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            await deleteLessonAction(course.id, module.id, deleteId);
            setDeleteId(null);
            router.refresh();
          });
        }}
      />
    </AdminPageShell>
  );
}
