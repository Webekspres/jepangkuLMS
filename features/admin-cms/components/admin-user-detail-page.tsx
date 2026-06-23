'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  BookOpen,
  Check,
  Coins,
  GraduationCap,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  approveEnrollmentAction,
  grantEnrollmentAction,
  rejectEnrollmentAction,
} from '@/features/admin-cms/actions/cms-enrollment-actions';
import { updateUserRoleAction } from '@/features/admin-cms/actions/cms-user-actions';
import type { AdminUserDetail } from '@/features/admin-cms/lib/load-admin-user-detail';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { formatIdr } from '@/lib/lms/format-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
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

type AdminUserDetailPageProps = {
  user: AdminUserDetail;
  courses: { id: string; title: string; slug: string }[];
};

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function progressLabel(completed: number, total: number): string {
  if (total === 0) return '—';
  const pct = Math.round((completed / total) * 100);
  return `${completed}/${total} pelajaran (${pct}%)`;
}

export function AdminUserDetailPage({ user, courses }: AdminUserDetailPageProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [grantCourseId, setGrantCourseId] = useState(courses[0]?.id ?? '');
  const [rejectEnrollmentId, setRejectEnrollmentId] = useState<string | null>(null);

  const displayName = user.displayName?.trim() || 'Pengguna';
  const initial = displayName.charAt(0).toUpperCase();
  const rejectTarget = user.enrollments.find((row) => row.id === rejectEnrollmentId);

  function refreshAfterAction(result: { ok: boolean; message?: string }, successMessage?: string) {
    if (!result.ok) {
      const message = result.message ?? 'Gagal memproses permintaan.';
      toast.error(message);
      setMessage(message);
      return;
    }
    if (successMessage) toast.success(successMessage);
    setMessage(null);
    router.refresh();
  }

  function handleRoleChange(role: 'LMS_STUDENT' | 'LMS_ADMIN') {
    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, role);
      refreshAfterAction(result, 'Role diperbarui.');
    });
  }

  function handleGrant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set('userId', user.id);
    formData.set('courseId', grantCourseId);
    startTransition(async () => {
      const result = await grantEnrollmentAction(formData);
      refreshAfterAction(result, 'Akses kursus berhasil diberikan.');
    });
  }

  function handleApprove(enrollmentId: string) {
    startTransition(async () => {
      const result = await approveEnrollmentAction(enrollmentId);
      refreshAfterAction(result, 'Enrollment disetujui.');
    });
  }

  function handleRejectConfirm() {
    if (!rejectEnrollmentId) return;
    startTransition(async () => {
      const result = await rejectEnrollmentAction(rejectEnrollmentId);
      refreshAfterAction(result, 'Enrollment dihapus.');
      setRejectEnrollmentId(null);
    });
  }

  return (
    <AdminPageShell
      label="Pengguna"
      title={displayName}
      subtitle="Detail profil LMS, role, dan kursus yang dimiliki siswa."
      backHref={ADMIN_ROUTES.users}
      backLabel="Kembali ke daftar pengguna"
    >
      {message ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="border-border p-5">
          <div className="flex items-start gap-4">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt=""
                width={64}
                height={64}
                className="size-16 rounded-xl object-cover"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-foreground">{displayName}</p>
              {user.equippedBadgeTitle ? (
                <p className="text-sm font-medium text-primary">{user.equippedBadgeTitle}</p>
              ) : null}
              <p className="mt-1 font-mono text-[10px] text-muted-foreground break-all">{user.id}</p>
              <p className="mt-2 text-xs text-muted-foreground">Terdaftar {formatDate(user.createdAt)}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Poin LMS
              </p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
                <Coins className="size-4 text-amber-500" />
                {user.lmsPoints}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Badge
              </p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
                <Award className="size-4 text-emerald-500" />
                {user.badgeCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Kursus aktif
              </p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
                <BookOpen className="size-4 text-primary" />
                {user.activeEnrollmentCount}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pelajaran selesai
              </p>
              <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums">
                <GraduationCap className="size-4 text-violet-500" />
                {user.completedLessonsTotal}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label>Role LMS</Label>
            <Select
              value={user.role}
              disabled={isPending}
              onValueChange={(value) => handleRoleChange(value as 'LMS_STUDENT' | 'LMS_ADMIN')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LMS_STUDENT">Siswa</SelectItem>
                <SelectItem value="LMS_ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {user.role === 'LMS_ADMIN' ? (
              <Badge variant="secondary">Admin LMS</Badge>
            ) : null}
          </div>
        </Card>

        <Card className="border-border p-5">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
            <UserPlus className="size-4 text-primary" />
            Tambah enrollment kursus
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Grant akses kursus langsung ke pengguna ini (status aktif).
          </p>
          <form onSubmit={handleGrant} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="grantCourse">Kursus</Label>
              <Select value={grantCourseId} onValueChange={setGrantCourseId}>
                <SelectTrigger id="grantCourse">
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
            <Button type="submit" disabled={isPending || !grantCourseId} className="shrink-0">
              Grant akses
            </Button>
          </form>
        </Card>
      </div>

      <Card className="overflow-hidden border-border">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">Kursus & enrollment</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {user.enrollmentCount} enrollment total · {user.quizAttempts} attempt kuis/tryout
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Kursus</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Progress</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Harga</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Terdaftar</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.enrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Belum memiliki kursus. Grant enrollment dari form di atas.
                </TableCell>
              </TableRow>
            ) : (
              user.enrollments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{row.courseTitle}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {row.courseLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{row.courseSlug}</span>
                    </div>
                    <Link
                      href={ADMIN_ROUTES.kursusModules(row.courseId)}
                      className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Kelola kursus →
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'PENDING' ? 'secondary' : 'default'}>
                      {row.status === 'PENDING' ? 'Menunggu' : 'Aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.status === 'ACTIVE'
                      ? progressLabel(row.completedLessons, row.totalLessons)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{formatIdr(row.priceIdr)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={isPending}
                          onClick={() => handleApprove(row.id)}
                        >
                          <Check className="size-3.5" />
                          Setujui
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => setRejectEnrollmentId(row.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setRejectEnrollmentId(row.id)}
                      >
                        Cabut akses
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AdminConfirmDialog
        open={rejectEnrollmentId !== null}
        title={rejectTarget?.status === 'PENDING' ? 'Tolak enrollment?' : 'Cabut akses kursus?'}
        description={
          rejectTarget
            ? rejectTarget.status === 'PENDING'
              ? `Hapus permintaan enrollment untuk kursus ${rejectTarget.courseTitle}?`
              : `Cabut akses ${displayName} ke kursus ${rejectTarget.courseTitle}? Progress tetap tersimpan di DB.`
            : 'Hapus enrollment ini?'
        }
        confirmLabel={rejectTarget?.status === 'PENDING' ? 'Tolak' : 'Cabut akses'}
        onConfirm={handleRejectConfirm}
        onOpenChange={(open) => {
          if (!open) setRejectEnrollmentId(null);
        }}
      />
    </AdminPageShell>
  );
}
