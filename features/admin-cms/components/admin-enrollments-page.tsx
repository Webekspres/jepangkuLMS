'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, Eye, History, Search, UserPlus } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import {
  AdminTableActionDelete,
  AdminTableActions,
} from '@/features/admin-cms/components/admin-table-actions';
import {
  approveEnrollmentAction,
  grantEnrollmentAction,
  rejectEnrollmentAction,
} from '@/features/admin-cms/actions/cms-enrollment-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type {
  AdminEnrollmentProductOption,
  AdminEnrollmentRow,
} from '@/features/admin-cms/lib/load-admin-enrollments';
import type { AdminEnrollmentHistoryRow } from '@/features/admin-cms/lib/load-admin-enrollment-history';
import {
  ENROLLMENT_LOG_ACTION_BADGE,
  ENROLLMENT_LOG_ACTION_LABEL,
} from '@/features/admin-cms/lib/enrollment-log-labels';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { formatIdr } from '@/lib/lms/format-price';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

type AdminEnrollmentsPageProps = {
  enrollments: AdminEnrollmentRow[];
  history: AdminEnrollmentHistoryRow[];
  pendingCount: number;
  courses: AdminEnrollmentProductOption[];
  liveClasses: AdminEnrollmentProductOption[];
  tryoutSessions: AdminEnrollmentProductOption[];
};

type StatusFilter = 'all' | 'PENDING' | 'ACTIVE';
type HistoryActionFilter = 'all' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'GRANTED' | 'REVOKED';
type MainTab = 'queue' | 'history';

const PRODUCT_TYPE_LABEL: Record<EnrollmentProductType, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'JLPT Tryout',
};

const PRODUCT_TYPE_BADGE: Record<EnrollmentProductType, string> = {
  COURSE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  LIVE_CLASS: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  TRYOUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export function AdminEnrollmentsPage({
  enrollments,
  history,
  pendingCount,
  courses,
  liveClasses,
  tryoutSessions,
}: AdminEnrollmentsPageProps) {
  const router = useRouter();
  const [mainTab, setMainTab] = useState<MainTab>('queue');
  const [query, setQuery] = useState('');
  const [historyQuery, setHistoryQuery] = useState('');
  const [historyActionFilter, setHistoryActionFilter] = useState<HistoryActionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('PENDING');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [grantUserId, setGrantUserId] = useState('');
  const [grantType, setGrantType] = useState<EnrollmentProductType>('COURSE');

  const productsByType = useMemo<Record<EnrollmentProductType, AdminEnrollmentProductOption[]>>(
    () => ({ COURSE: courses, LIVE_CLASS: liveClasses, TRYOUT: tryoutSessions }),
    [courses, liveClasses, tryoutSessions],
  );

  const productOptions = productsByType[grantType];
  const [grantProductId, setGrantProductId] = useState(productOptions[0]?.id ?? '');

  const handleTypeChange = (value: EnrollmentProductType) => {
    setGrantType(value);
    setGrantProductId(productsByType[value][0]?.id ?? '');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return enrollments.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.userId.toLowerCase().includes(q) ||
        (row.userDisplayName?.toLowerCase().includes(q) ?? false) ||
        row.productTitle.toLowerCase().includes(q) ||
        row.productSubtitle.toLowerCase().includes(q)
      );
    });
  }, [enrollments, query, statusFilter]);

  const filteredHistory = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return history.filter((row) => {
      if (historyActionFilter !== 'all' && row.action !== historyActionFilter) return false;
      if (!q) return true;
      return (
        row.userId.toLowerCase().includes(q) ||
        (row.studentName?.toLowerCase().includes(q) ?? false) ||
        (row.actorName?.toLowerCase().includes(q) ?? false) ||
        row.productTitle.toLowerCase().includes(q) ||
        (row.productSubtitle?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [history, historyQuery, historyActionFilter]);

  const {
    paginatedItems,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(filtered, { resetKey: `${query}-${statusFilter}` });

  const {
    paginatedItems: paginatedHistory,
    page: historyPage,
    pageSize: historyPageSize,
    totalItems: historyTotalItems,
    setPage: setHistoryPage,
    setPageSize: setHistoryPageSize,
  } = useAdminTablePagination(filteredHistory, {
    resetKey: `${historyQuery}-${historyActionFilter}`,
  });

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
    formData.set('type', grantType);
    formData.set('productId', grantProductId);
    runAction(() => grantEnrollmentAction(formData), 'Enrollment berhasil diberikan.');
  };

  return (
    <AdminPageShell
      label="Enrollment"
      title="Manajemen Enrollment"
      subtitle="Verifikasi pembayaran manual, aktifkan akses program, dan lacak riwayat tindakan enrollment."
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
          <form onSubmit={handleGrant} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex-1 space-y-2 sm:min-w-[180px]">
              <Label htmlFor="grant-user-id">Clerk User ID</Label>
              <Input
                id="grant-user-id"
                value={grantUserId}
                onChange={(event) => setGrantUserId(event.target.value)}
                placeholder="user_..."
                required
              />
            </div>
            <div className="space-y-2 sm:w-40">
              <Label>Tipe Produk</Label>
              <Select
                value={grantType}
                onValueChange={(value) => handleTypeChange(value as EnrollmentProductType)}
              >
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
            <div className="flex-1 space-y-2 sm:min-w-[180px]">
              <Label>{PRODUCT_TYPE_LABEL[grantType]}</Label>
              <Select
                value={grantProductId}
                onValueChange={setGrantProductId}
                disabled={productOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      productOptions.length === 0
                        ? `Belum ada ${PRODUCT_TYPE_LABEL[grantType].toLowerCase()}`
                        : 'Pilih item'
                    }
                  />
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
            <Button type="submit" disabled={isPending || !grantProductId} className="gap-2">
              <UserPlus className="size-4" />
              Aktifkan
            </Button>
          </form>
        </Card>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="queue">
            <Clock className="size-3.5" />
            Antrian
            {pendingCount > 0 ? (
              <TabCountBadge count={pendingCount} tone="warning" />
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="size-3.5" />
            Riwayat
            <TabCountBadge count={history.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-0 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <TableHead>Tipe</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
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
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRODUCT_TYPE_BADGE[row.type]}`}
                    >
                      {PRODUCT_TYPE_LABEL[row.type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{row.productTitle}</p>
                    <p className="text-xs text-muted-foreground">{row.productSubtitle}</p>
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
                      <AdminTableActions>
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
                        <AdminTableActionDelete
                          label="Tolak enrollment"
                          disabled={isPending}
                          onClick={() => setRejectId(row.id)}
                        />
                      </AdminTableActions>
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
        </TabsContent>

        <TabsContent value="history" className="mt-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={historyQuery}
                onChange={(event) => setHistoryQuery(event.target.value)}
                placeholder="Cari siswa, admin, atau produk..."
                className="pl-9"
              />
            </div>
            <Select
              value={historyActionFilter}
              onValueChange={(value) => setHistoryActionFilter(value as HistoryActionFilter)}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua aksi</SelectItem>
                <SelectItem value="REQUESTED">Diajukan</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="GRANTED">Diberikan manual</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
                <SelectItem value="REVOKED">Akses dicabut</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Belum ada riwayat enrollment untuk filter ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedHistory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {row.createdAt.toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ENROLLMENT_LOG_ACTION_BADGE[row.action]}`}
                        >
                          {ENROLLMENT_LOG_ACTION_LABEL[row.action]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{row.studentName ?? '—'}</p>
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
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRODUCT_TYPE_BADGE[row.type]}`}
                        >
                          {PRODUCT_TYPE_LABEL[row.type]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{row.productTitle}</p>
                        {row.productSubtitle ? (
                          <p className="text-xs text-muted-foreground">{row.productSubtitle}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.action === 'REQUESTED'
                          ? (row.actorName ?? 'Siswa')
                          : (row.actorName ?? 'Admin')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <AdminTablePagination
              page={historyPage}
              pageSize={historyPageSize}
              totalItems={historyTotalItems}
              onPageChange={setHistoryPage}
              onPageSizeChange={setHistoryPageSize}
              itemLabel="riwayat"
            />
          </Card>
        </TabsContent>
      </Tabs>

      <AdminConfirmDialog
        open={rejectId !== null}
        title="Tolak enrollment?"
        description={
          rejectTarget
            ? `Hapus permintaan enrollment ${rejectTarget.userDisplayName ?? rejectTarget.userId} untuk ${rejectTarget.productTitle}?`
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
