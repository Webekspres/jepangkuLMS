'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  BookOpen,
  Check,
  Coins,
  GraduationCap,
  Target,
  UserPlus,
  Video,
} from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  AdminTableActionDelete,
  AdminTableActions,
} from '@/features/admin-cms/components/admin-table-actions';
import {
  approveEnrollmentAction,
  grantEnrollmentAction,
  rejectEnrollmentAction,
} from '@/features/admin-cms/actions/cms-enrollment-actions';
import { updateUserRoleAction } from '@/features/admin-cms/actions/cms-user-actions';
import type {
  AdminGrantProductOption,
  AdminUserDetail,
} from '@/features/admin-cms/lib/load-admin-user-detail';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { formatIdr } from '@/lib/lms/format-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCountBadge } from '@/components/ui/tabs';
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

type EnrollmentProductType = 'COURSE' | 'LIVE_CLASS' | 'TRYOUT';

type AdminUserDetailPageProps = {
  user: AdminUserDetail;
  grantOptions: {
    courses: AdminGrantProductOption[];
    liveClasses: AdminGrantProductOption[];
    tryoutSessions: AdminGrantProductOption[];
  };
};

const PRODUCT_TYPE_LABEL: Record<EnrollmentProductType, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'JLPT Tryout',
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

type RejectTarget = {
  id: string;
  status: 'PENDING' | 'ACTIVE';
  label: string;
};

export function AdminUserDetailPage({ user, grantOptions }: AdminUserDetailPageProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [grantType, setGrantType] = useState<EnrollmentProductType>('COURSE');
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);

  const productsByType = useMemo(
    () => ({
      COURSE: grantOptions.courses,
      LIVE_CLASS: grantOptions.liveClasses,
      TRYOUT: grantOptions.tryoutSessions,
    }),
    [grantOptions],
  );

  const productOptions = productsByType[grantType];
  const [grantProductId, setGrantProductId] = useState(productOptions[0]?.id ?? '');

  const defaultEnrollmentTab = useMemo(() => {
    if (user.courseEnrollments.length > 0) return 'course';
    if (user.liveClassEnrollments.length > 0) return 'live-class';
    if (user.tryoutEnrollments.length > 0) return 'tryout';
    return 'course';
  }, [user.courseEnrollments.length, user.liveClassEnrollments.length, user.tryoutEnrollments.length]);

  const [enrollmentTab, setEnrollmentTab] = useState(defaultEnrollmentTab);

  const displayName = user.resolvedDisplayName;
  const initial = displayName.charAt(0).toUpperCase();

  const pendingByTab = {
    course: user.courseEnrollments.filter((r) => r.status === 'PENDING').length,
    'live-class': user.liveClassEnrollments.filter((r) => r.status === 'PENDING').length,
    tryout: user.tryoutEnrollments.filter((r) => r.status === 'PENDING').length,
  };

  function handleTypeChange(value: EnrollmentProductType) {
    setGrantType(value);
    setGrantProductId(productsByType[value][0]?.id ?? '');
  }

  function refreshAfterAction(result: { ok: boolean; message?: string }, successMessage?: string) {
    if (!result.ok) {
      const msg = result.message ?? 'Gagal memproses permintaan.';
      toast.error(msg);
      setMessage(msg);
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
    formData.set('type', grantType);
    formData.set('productId', grantProductId);
    startTransition(async () => {
      const result = await grantEnrollmentAction(formData);
      refreshAfterAction(result, 'Akses program berhasil diberikan.');
    });
  }

  function handleApprove(enrollmentId: string) {
    startTransition(async () => {
      const result = await approveEnrollmentAction(enrollmentId);
      refreshAfterAction(result, 'Enrollment disetujui.');
    });
  }

  function handleRejectConfirm() {
    if (!rejectTarget) return;
    startTransition(async () => {
      const result = await rejectEnrollmentAction(rejectTarget.id);
      refreshAfterAction(result, 'Enrollment dihapus.');
      setRejectTarget(null);
    });
  }

  return (
    <AdminPageShell
      label="Pengguna"
      title={displayName}
      subtitle="Detail profil LMS, role, dan program yang diikuti siswa."
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
              {user.ssoEmail ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  <a href={`mailto:${user.ssoEmail}`} className="hover:text-foreground hover:underline">
                    {user.ssoEmail}
                  </a>
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Email belum tersedia</p>
              )}
              {user.phone ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  <a href={`tel:${user.phone}`} className="hover:text-foreground hover:underline tabular-nums">
                    {user.phone}
                  </a>
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Nomor ponsel belum diisi</p>
              )}
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
                Program aktif
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
            Tambah enrollment program
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Grant akses kursus, live class, atau tryout langsung ke pengguna ini (status aktif).
          </p>
          <form onSubmit={handleGrant} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Jenis program</Label>
                <Select value={grantType} onValueChange={(v) => handleTypeChange(v as EnrollmentProductType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COURSE">Kursus</SelectItem>
                    <SelectItem value="LIVE_CLASS">Live Class</SelectItem>
                    <SelectItem value="TRYOUT">JLPT Tryout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{PRODUCT_TYPE_LABEL[grantType]}</Label>
                <Select value={grantProductId} onValueChange={setGrantProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Pilih ${PRODUCT_TYPE_LABEL[grantType].toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isPending || !grantProductId} className="shrink-0">
              Grant akses
            </Button>
          </form>
        </Card>
      </div>

      <Card className="overflow-hidden border-border">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-bold text-foreground">Enrollment program</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {user.enrollmentCount} total · {user.quizAttempts} attempt kuis/tryout
          </p>
        </div>

        <Tabs value={enrollmentTab} onValueChange={setEnrollmentTab} className="gap-0">
          <div className="px-5 pt-3">
            <TabsList variant="line" className="gap-4">
              <TabsTrigger value="course">
                <BookOpen className="size-3.5" />
                Kursus
                <TabCountBadge count={user.courseEnrollments.length} pending={pendingByTab.course} />
              </TabsTrigger>
              <TabsTrigger value="live-class">
                <Video className="size-3.5" />
                Live Class
                <TabCountBadge count={user.liveClassEnrollments.length} pending={pendingByTab['live-class']} />
              </TabsTrigger>
              <TabsTrigger value="tryout">
                <Target className="size-3.5" />
                JLPT Tryout
                <TabCountBadge count={user.tryoutEnrollments.length} pending={pendingByTab.tryout} />
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="course" className="mt-0">
            <EnrollmentTable
              headers={['Program', 'Status', 'Progress', 'Harga', 'Terdaftar', 'Aksi']}
              emptyMessage="Belum memiliki kursus."
              isEmpty={user.courseEnrollments.length === 0}
            >
              {user.courseEnrollments.map((row) => (
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
                    <EnrollmentActions
                      enrollmentId={row.id}
                      status={row.status}
                      label={row.courseTitle}
                      isPending={isPending}
                      onApprove={handleApprove}
                      onReject={() =>
                        setRejectTarget({ id: row.id, status: row.status, label: row.courseTitle })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </EnrollmentTable>
          </TabsContent>

          <TabsContent value="live-class" className="mt-0">
            <EnrollmentTable
              headers={['Program', 'Level', 'Status', 'Harga', 'Terdaftar', 'Aksi']}
              emptyMessage="Belum terdaftar di live class."
              isEmpty={user.liveClassEnrollments.length === 0}
            >
              {user.liveClassEnrollments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.senseiName}</p>
                    <Link
                      href={ADMIN_ROUTES.liveClass}
                      className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Kelola live class →
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'PENDING' ? 'secondary' : 'default'}>
                      {row.status === 'PENDING' ? 'Menunggu' : 'Aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatIdr(row.priceIdr)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EnrollmentActions
                      enrollmentId={row.id}
                      status={row.status}
                      label={row.title}
                      isPending={isPending}
                      onApprove={handleApprove}
                      onReject={() =>
                        setRejectTarget({ id: row.id, status: row.status, label: row.title })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </EnrollmentTable>
          </TabsContent>

          <TabsContent value="tryout" className="mt-0">
            <EnrollmentTable
              headers={['Sesi', 'Level', 'Status', 'Harga', 'Terdaftar', 'Aksi']}
              emptyMessage="Belum terdaftar di sesi tryout."
              isEmpty={user.tryoutEnrollments.length === 0}
            >
              {user.tryoutEnrollments.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {row.phaseLabel} · <code>{row.code}</code>
                    </p>
                    <Link
                      href={ADMIN_ROUTES.tryoutSessionFormEdit(row.tryoutSessionId)}
                      className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      Edit sesi →
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {row.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'PENDING' ? 'secondary' : 'default'}>
                      {row.status === 'PENDING' ? 'Menunggu' : 'Aktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{formatIdr(row.priceIdr)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <EnrollmentActions
                      enrollmentId={row.id}
                      status={row.status}
                      label={row.title}
                      isPending={isPending}
                      onApprove={handleApprove}
                      onReject={() =>
                        setRejectTarget({ id: row.id, status: row.status, label: row.title })
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </EnrollmentTable>
          </TabsContent>
        </Tabs>
      </Card>

      <AdminConfirmDialog
        open={rejectTarget !== null}
        title={rejectTarget?.status === 'PENDING' ? 'Tolak enrollment?' : 'Cabut akses?'}
        description={
          rejectTarget
            ? rejectTarget.status === 'PENDING'
              ? `Hapus permintaan enrollment untuk ${rejectTarget.label}?`
              : `Cabut akses ${displayName} ke ${rejectTarget.label}?`
            : 'Hapus enrollment ini?'
        }
        confirmLabel={rejectTarget?.status === 'PENDING' ? 'Tolak' : 'Cabut akses'}
        onConfirm={handleRejectConfirm}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        loading={isPending}
      />
    </AdminPageShell>
  );
}

function EnrollmentTable({
  headers,
  emptyMessage,
  isEmpty,
  children,
}: {
  headers: string[];
  emptyMessage: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead
              key={header}
              className={`text-xs uppercase tracking-wider ${header === 'Aksi' ? 'text-right' : ''}`}
            >
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isEmpty ? (
          <TableRow>
            <TableCell colSpan={headers.length} className="py-12 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          children
        )}
      </TableBody>
    </Table>
  );
}

function EnrollmentActions({
  enrollmentId,
  status,
  isPending,
  onApprove,
  onReject,
}: {
  enrollmentId: string;
  status: 'PENDING' | 'ACTIVE';
  label: string;
  isPending: boolean;
  onApprove: (id: string) => void;
  onReject: () => void;
}) {
  if (status === 'PENDING') {
    return (
      <AdminTableActions>
        <Button
          size="sm"
          className="gap-1"
          disabled={isPending}
          onClick={() => onApprove(enrollmentId)}
        >
          <Check className="size-3.5" />
          Setujui
        </Button>
        <AdminTableActionDelete label="Tolak enrollment" disabled={isPending} onClick={onReject} />
      </AdminTableActions>
    );
  }

  return (
    <Button size="sm" variant="destructive" disabled={isPending} onClick={onReject}>
      Cabut akses
    </Button>
  );
}
