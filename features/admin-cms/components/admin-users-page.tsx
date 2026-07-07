'use client';

import { useMemo, useState, useTransition } from 'react';
import { Eye, Search, Users } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import { AdminTableAction, AdminTableActions } from '@/features/admin-cms/components/admin-table-actions';
import { updateUserRoleAction } from '@/features/admin-cms/actions/cms-user-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type { AdminUserRow } from '@/features/admin-cms/lib/load-admin-users';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export function AdminUsersPage({ users }: { users: AdminUserRow[] }) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.id.toLowerCase().includes(q) ||
        (user.resolvedDisplayName ?? '').toLowerCase().includes(q) ||
        (user.displayName ?? '').toLowerCase().includes(q) ||
        (user.ssoDisplayName ?? '').toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q),
    );
  }, [users, query]);

  const {
    paginatedItems: paginatedUsers,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(filtered, { resetKey: query });

  function handleRoleChange(userId: string, role: 'LMS_STUDENT' | 'LMS_ADMIN') {
    startTransition(async () => {
      const result = await updateUserRoleAction(userId, role);
      if (result.ok) {
        toast.success('Role diperbarui.');
        setMessage(null);
      } else {
        toast.error(result.message);
        setMessage(result.message);
      }
    });
  }

  return (
    <AdminPageShell
      label="Pengguna"
      title="Kelola Pengguna"
      subtitle="Lihat detail pengguna, kursus yang dimiliki, dan atur role LMS lokal."
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
            placeholder="Cari nama, SSO, Clerk ID, atau role..."
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs uppercase tracking-wider">Pengguna</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Kursus</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Poin</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Badge</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Role LMS</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 size-8 opacity-40" />
                  Belum ada pengguna terdaftar.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{user.resolvedDisplayName}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{user.id}</p>
                  </TableCell>
                  <TableCell>
                    <p className="tabular-nums font-medium">{user.activeEnrollmentCount} aktif</p>
                    <p className="text-xs text-muted-foreground">{user.enrollmentCount} total</p>
                  </TableCell>
                  <TableCell className="tabular-nums">{user.lmsPoints}</TableCell>
                  <TableCell className="tabular-nums">{user.badgeCount}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      disabled={isPending}
                      onValueChange={(value) =>
                        handleRoleChange(user.id, value as 'LMS_STUDENT' | 'LMS_ADMIN')
                      }
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LMS_STUDENT">Siswa</SelectItem>
                        <SelectItem value="LMS_ADMIN">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <AdminTableActions>
                      <AdminTableAction
                        label="Detail pengguna"
                        icon={Eye}
                        href={ADMIN_ROUTES.userDetail(user.id)}
                        showLabel
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
          itemLabel="pengguna"
        />
      </Card>
    </AdminPageShell>
  );
}
