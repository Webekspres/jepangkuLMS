'use client';

import { useMemo, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import { deleteBadgeAction } from '@/features/admin-cms/actions/cms-badge-actions';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import type { AdminBadgeRow } from '@/features/admin-cms/lib/load-admin-badges';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { mapLmsBadgeRarityToDisplay } from '@/lib/lms/badge-rarity';
import { getBadgeRarityStyle } from '@/features/student/components/student-achievements-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

function BadgeRarityChip({ rarity }: { rarity: AdminBadgeRow['rarity'] | null | undefined }) {
    const rarityLabel = mapLmsBadgeRarityToDisplay(rarity ?? undefined);
    const style = getBadgeRarityStyle(rarityLabel);
    return (
        <span
            className={cn(
                'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                style.chip,
            )}
        >
            {rarityLabel}
        </span>
    );
}

export function AdminBadgesPage({
    badges,
    r2Configured,
}: {
    badges: AdminBadgeRow[];
    r2Configured: boolean;
}) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<string | null>(null);
    const r2Ready = r2Configured;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return badges;
        return badges.filter(
            (badge) =>
                badge.title.toLowerCase().includes(q) ||
                badge.code.toLowerCase().includes(q) ||
                (badge.description ?? '').toLowerCase().includes(q),
        );
    }, [badges, query]);

    const {
        paginatedItems: paginatedBadges,
        page,
        pageSize,
        totalItems,
        setPage,
        setPageSize,
    } = useAdminTablePagination(filtered, { resetKey: query });

    const deleteTarget = badges.find((badge) => badge.id === deleteId);

    return (
        <AdminPageShell
            label="Gamifikasi"
            title="Kelola Badge"
            subtitle="Badge LMS disimpan lokal — gambar di-upload ke Cloudflare R2."
            action={
                <Button asChild>
                    <Link href={ADMIN_ROUTES.badgesForm}>
                        <Plus className="size-4" />
                        Badge Baru
                    </Link>
                </Button>
            }
        >
            {!r2Ready ? (
                <Card className="mb-4 border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
                    <p className="font-semibold">R2 belum dikonfigurasi</p>
                    <p className="mt-1 text-muted-foreground">
                        Tambahkan <code className="text-xs">R2_ACCOUNT_ID</code>,{' '}
                        <code className="text-xs">R2_ACCESS_KEY_ID</code>,{' '}
                        <code className="text-xs">R2_SECRET_ACCESS_KEY</code>,{' '}
                        <code className="text-xs">R2_BUCKET</code>, dan{' '}
                        <code className="text-xs">R2_PUBLIC_URL</code> di <code className="text-xs">.env</code>{' '}
                        agar upload gambar badge berfungsi. CRUD teks tetap bisa tanpa R2.
                    </p>
                </Card>
            ) : null}

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
                        placeholder="Cari judul, kode, atau deskripsi..."
                        className="pl-9"
                    />
                </div>
            </Card>

            <Card className="overflow-hidden border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xs uppercase tracking-wider">Badge</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider">Kode</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider">Rarity</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider">Unlock</TableHead>
                            <TableHead className="text-xs uppercase tracking-wider">Urutan</TableHead>
                            <TableHead className="text-right text-xs uppercase tracking-wider">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                    <Award className="mx-auto mb-2 size-8 opacity-40" />
                                    Belum ada badge. Buat badge pertama untuk gamifikasi LMS.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedBadges.map((badge) => (
                                <TableRow key={badge.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            {badge.imageUrl ? (
                                                <Image
                                                    src={badge.imageUrl}
                                                    alt=""
                                                    width={40}
                                                    height={40}
                                                    unoptimized={isUnoptimizedImageSrc(badge.imageUrl)}
                                                    className="size-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-lg">
                                                    🏅
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium text-foreground">{badge.title}</p>
                                                <p className="line-clamp-1 text-xs text-muted-foreground">
                                                    {badge.description ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-mono text-[10px]">
                                            {badge.code}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <BadgeRarityChip rarity={badge.rarity} />
                                    </TableCell>
                                    <TableCell className="tabular-nums">{badge.unlockCount}</TableCell>
                                    <TableCell className="tabular-nums">{badge.sortOrder}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button asChild variant="ghost" size="icon" className="size-8">
                                                <Link href={ADMIN_ROUTES.badgesFormEdit(badge.id)}>
                                                    <Pencil className="size-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-destructive"
                                                onClick={() => setDeleteId(badge.id)}
                                            >
                                                <Trash2 className="size-4" />
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
                    itemLabel="badge"
                />
            </Card>

            <AdminConfirmDialog
                open={deleteId != null}
                title="Hapus badge?"
                description={
                    deleteTarget
                        ? `Badge "${deleteTarget.title}" akan dihapus permanen beserta riwayat unlock.`
                        : 'Badge akan dihapus permanen beserta riwayat unlock.'
                }
                confirmLabel="Hapus"
                loading={isPending}
                onOpenChange={(open) => !open && setDeleteId(null)}
                onConfirm={() => {
                    if (!deleteId) return;
                    startTransition(async () => {
                        const result = await deleteBadgeAction(deleteId);
                        setMessage(result.ok ? 'Badge dihapus.' : result.message);
                        setDeleteId(null);
                        if (result.ok) router.refresh();
                    });
                }}
            />
        </AdminPageShell>
    );
}
