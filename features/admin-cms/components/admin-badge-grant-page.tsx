'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminUserPicker } from '@/features/admin-cms/components/admin-user-picker';
import { grantBadgeAction } from '@/features/admin-cms/actions/cms-badge-actions';
import type { AdminGrantBadgeOption } from '@/features/admin-cms/lib/load-admin-badge-grants';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type AdminBadgeGrantPageProps = {
  badges: AdminGrantBadgeOption[];
};

export function AdminBadgeGrantPage({ badges }: AdminBadgeGrantPageProps) {
  const router = useRouter();
  const [grantUserId, setGrantUserId] = useState('');
  const [grantBadgeId, setGrantBadgeId] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleGrant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set('userId', grantUserId);
    formData.set('badgeId', grantBadgeId);
    startTransition(async () => {
      const result = await grantBadgeAction(formData);
      if (!result.ok) {
        toast.error(result.message);
        setMessage(result.message);
        return;
      }
      toast.success('Badge berhasil diberikan.');
      setMessage(null);
      setGrantUserId('');
      setGrantBadgeId('');
      router.refresh();
    });
  };

  return (
    <AdminPageShell
      label="Gamifikasi"
      title="Beri Badge"
      subtitle="Pilih badge dari katalog, lalu berikan ke siswa."
      backHref={ADMIN_ROUTES.badges}
      backLabel="Kembali ke Badge"
    >
      {message ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {message}
        </p>
      ) : null}

      <Card className="p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Grant badge</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Semua badge di katalog bisa diberikan. Unlock otomatis tetap mengikuti aturan di form
            badge.
          </p>
        </div>

        {badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada badge di katalog.{' '}
            <Link href={ADMIN_ROUTES.badgesForm} className="font-medium text-primary hover:underline">
              Buat badge baru
            </Link>{' '}
            dulu di menu Badge.
          </p>
        ) : (
          <form onSubmit={handleGrant} className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-5">
                <Label htmlFor="grant-student-picker">Siswa</Label>
                <AdminUserPicker
                  id="grant-student-picker"
                  value={grantUserId}
                  onValueChange={setGrantUserId}
                  disabled={isPending}
                  required
                  showHint={false}
                  hideLabel
                />
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-5">
                <Label htmlFor="grant-badge-id">Badge</Label>
                <Select
                  value={grantBadgeId}
                  onValueChange={setGrantBadgeId}
                  disabled={isPending}
                >
                  <SelectTrigger id="grant-badge-id" className="h-10 w-full">
                    <SelectValue placeholder="Pilih badge" />
                  </SelectTrigger>
                  <SelectContent>
                    {badges.map((badge) => (
                      <SelectItem key={badge.id} value={badge.id}>
                        {badge.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 xl:col-span-2">
                <Label className="invisible select-none" aria-hidden>
                  Berikan
                </Label>
                <Button
                  type="submit"
                  disabled={isPending || !grantUserId || !grantBadgeId}
                  className="h-10 w-full gap-2"
                >
                  <Gift className="size-4" />
                  Berikan
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Cari siswa by nama tampilan atau SSO (min. 2 karakter), atau tempel Clerk ID langsung (
              <code className="rounded bg-muted px-1">user_…</code>). Riwayat unlock ada di tab
              Riwayat menu Badge.
            </p>
          </form>
        )}
      </Card>
    </AdminPageShell>
  );
}
