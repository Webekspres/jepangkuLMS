'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import {
  deleteCourseAction,
  toggleCoursePublishedAction,
} from '@/features/admin-cms/actions/cms-course-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type { AdminCourseRow } from '@/features/admin-cms/lib/load-admin-cms-data';
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

export function AdminCoursesPage({ courses }: { courses: AdminCourseRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(q) ||
        course.slug.toLowerCase().includes(q) ||
        course.level.toLowerCase().includes(q),
    );
  }, [courses, query]);

  const {
    paginatedItems: paginatedCourses,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(filtered, { resetKey: query });

  const deleteTarget = courses.find((course) => course.id === deleteId);

  return (
    <AdminPageShell
      label="Konten"
      title="Kelola Kursus"
      subtitle="Buat, edit, dan publikasikan paket kursus JepangKu."
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={ADMIN_ROUTES.kursusImport}>Import CSV</Link>
          </Button>
          <Button asChild>
            <Link href={ADMIN_ROUTES.kursusForm}>
              <Plus className="size-4" />
              Kursus Baru
            </Link>
          </Button>
        </div>
      }
    >
      {message ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
          {message}
        </p>
      ) : null}

      <Card className="mb-6 border-border p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari judul, slug, atau level..."
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Kursus</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Level</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Struktur</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Belum ada kursus. Buat kursus pertama untuk mulai menambah modul.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{course.title}</p>
                      <p className="text-xs text-muted-foreground">{course.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{course.level}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.moduleCount} modul · {course.lessonCount} pelajaran
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        course.isPublished
                          ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10'
                          : 'bg-muted text-muted-foreground hover:bg-muted'
                      }
                    >
                      {course.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild size="sm" variant="outline">
                        <Link href={ADMIN_ROUTES.kursusModules(course.id)}>
                          <Layers className="size-3.5" />
                          Modul
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`${ADMIN_ROUTES.kursusForm}?id=${course.id}`}>
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            await toggleCoursePublishedAction(course.id, !course.isPublished);
                            router.refresh();
                          })
                        }
                      >
                        {course.isPublished ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(course.id)}
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
          itemLabel="kursus"
        />
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus kursus?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" beserta semua modul dan pelajaran akan dihapus permanen.`
            : 'Kursus akan dihapus permanen.'
        }
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            const result = await deleteCourseAction(deleteId);
            setDeleteId(null);
            if (result.ok) {
              setMessage('Kursus berhasil dihapus.');
              router.refresh();
            }
          });
        }}
      />
    </AdminPageShell>
  );
}
