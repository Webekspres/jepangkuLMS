'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import { deleteLessonAction } from '@/features/admin-cms/actions/cms-lesson-actions';
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

type LessonRow = {
  id: string;
  title: string;
  slug: string;
  order: number;
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    paginatedItems: paginatedLessons,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(lessons);

  const deleteTarget = lessons.find((lesson) => lesson.id === deleteId);

  return (
    <AdminPageShell
      label={course.title}
      title={module.title}
      subtitle="Kelola pelajaran dalam modul ini — video, flashcard, dan kuis diatur per lesson."
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
        <span>{lessons.length} pelajaran</span>
      </div>

      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-xs uppercase tracking-wider">Urut</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Pelajaran</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Konten</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lessons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  Belum ada pelajaran di modul ini.
                </TableCell>
              </TableRow>
            ) : (
              paginatedLessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell className="font-mono text-sm">{lesson.order}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">{lesson.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
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
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/dashboard/belajar/${course.slug}/${lesson.slug}`}
                          target="_blank"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`${ADMIN_ROUTES.kursusLessonForm(course.id, module.id)}?id=${lesson.id}`}
                        >
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(lesson.id)}
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
          itemLabel="pelajaran"
        />
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus pelajaran?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" beserta materi dan soal terkait akan dihapus.`
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
