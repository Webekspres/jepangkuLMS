'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Eye, Search, Trash2, UserPlus } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import {
  approveEnrollmentAction,
  grantEnrollmentAction,
  rejectEnrollmentAction,
} from '@/features/admin-cms/actions/cms-enrollment-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type { AdminEnrollmentRow } from '@/features/admin-cms/lib/load-admin-enrollments';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { formatIdr } from '@/lib/lms/format-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AdminEnrollmentsPageProps = {
  enrollments: AdminEnrollmentRow[];
  pendingCount: number;
  courses: { id: string; title: string; slug: string }[];
};

type StatusFilter = 'all' | 'PENDING' | 'ACTIVE';

export function AdminEnrollmentsPage({
  enrollments,
  pendingCount,
  courses,
}: AdminEnrollmentsPageProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantCourseId, setGrantCourseId] = useState(courses[0]?.id ?? '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrollments.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.userId.toLowerCase().includes(q) ||
        (row.userDisplayName?.toLowerCase().includes(q) ?? false) ||
        row.courseTitle.toLowerCase().includes(q) ||
        row.courseSlug.toLowerCase().includes(q)
      );
    });
  }, [enrollments, query, statusFilter]);

  const {
    paginatedItems,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(filtered, { resetKey: `${query}-${statusFilter}` });

  const rejectTarget = enrollments.find((row) => row.id === rejectId);

  const runAction = (action: () => Promise<{ ok: boolean; message?: string }>, successMessage?: string) => {
    startTransition(async () => {
      const result = await action();
      if (!result.ok && result.message) {
        toast.error(result.message);
        setMessage(result.message);
        return;
      }
      if (successMessage) toast.success(successMessage);
      setMessage(null);
      router.refresh();
    });
  };

  const handleGrant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set('userId', grantUserId);
    formData.set('courseId', grantCourseId);
    runAction(() => grantEnrollmentAction(formData), 'Enrollment berhasil diberikan.');
  };

  return (
    <AdminPageShell
      label="Enrollment"
      title="Manajemen Enrollment"
      subtitle="Verifikasi pembayaran manual dan aktifkan akses kursus untuk siswa."
    >
      {message ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Menunggu verifikasi
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
        </Card>
        <Card className="p-4 md:col-span-2">
          <p className="mb-3 text-sm font-semibold text-foreground">Aktifkan enrollment manual</p>
          <form onSubmit={handleGrant} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="grant-user-id">Clerk User ID</Label>
              <Input
                id="grant-user-id"
                value={grantUserId}
                onChange={(event) => setGrantUserId(event.target.value)}
                placeholder="user_..."
                required
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Kursus</Label>
              <Select value={grantCourseId} onValueChange={setGrantCourseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kursus" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending || !grantCourseId} className="gap-2">
              <UserPlus className="size-4" />
              Aktifkan
            </Button>
          </form>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari siswa atau kursus..."
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Menunggu</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="all">Semua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Siswa</TableHead>
              <TableHead>Kursus</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Tidak ada enrollment untuk filter ini.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium">{row.userDisplayName ?? '—'}</p>
                    <p className="font-mono text-xs text-muted-foreground">{row.userId}</p>
                    <Link
                      href={ADMIN_ROUTES.userDetail(row.userId)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Eye className="size-3" />
                      Detail pengguna
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{row.courseTitle}</p>
                    <p className="text-xs text-muted-foreground">{row.courseSlug}</p>
                  </TableCell>
                  <TableCell>{formatIdr(row.priceIdr)}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'PENDING' ? 'secondary' : 'default'}>
                      {row.status === 'PENDING' ? 'Menunggu' : 'Aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.createdAt.toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={isPending}
                          onClick={() =>
                            runAction(
                              () => approveEnrollmentAction(row.id),
                              'Enrollment disetujui.',
                            )
                          }
                        >
                          <Check className="size-3.5" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => setRejectId(row.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
        />
      </Card>

      <AdminConfirmDialog
        open={rejectId !== null}
        title="Tolak enrollment?"
        description={
          rejectTarget
            ? `Hapus permintaan enrollment ${rejectTarget.userDisplayName ?? rejectTarget.userId} untuk kursus ${rejectTarget.courseTitle}?`
            : 'Hapus permintaan enrollment ini?'
        }
        confirmLabel="Tolak"
        onConfirm={() => {
          if (!rejectId) return;
          runAction(() => rejectEnrollmentAction(rejectId));
          setRejectId(null);
        }}
        onOpenChange={(open) => {
          if (!open) setRejectId(null);
        }}
      />
    </AdminPageShell>
  );
}
