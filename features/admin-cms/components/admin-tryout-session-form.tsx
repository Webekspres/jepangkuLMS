'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createTryoutSessionAction,
  updateTryoutSessionAction,
} from '@/features/admin-cms/actions/cms-tryout-actions';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type TryoutFormData = {
  id?: string;
  code: string;
  title: string;
  phaseLabel: string;
  description: string | null;
  scheduledAt: string;
  timeLimitMinutes: number;
  isActive: boolean;
  sortOrder: number;
};

export function AdminTryoutSessionFormPage({ session }: { session?: TryoutFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(session?.id);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = isEdit
        ? await updateTryoutSessionAction(session!.id!, formData)
        : await createTryoutSessionAction(formData);

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success(isEdit ? 'Sesi diperbarui' : 'Sesi dibuat');
      router.push(ADMIN_ROUTES.tryoutSessions);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title={isEdit ? 'Edit Sesi Tryout' : 'Sesi Tryout Baru'}
      subtitle="Kode sesi dipakai di URL tryout siswa (?session=…&level=N5)."
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.tryoutSessions}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      <Card className="max-w-xl border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Sesi</Label>
            <Input id="title" name="title" defaultValue={session?.title ?? ''} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Kode (URL)</Label>
              <Input
                id="code"
                name="code"
                placeholder="fase-1-2026"
                defaultValue={session?.code ?? ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phaseLabel">Label Fase</Label>
              <Input
                id="phaseLabel"
                name="phaseLabel"
                placeholder="Fase 1 — N5 Starter"
                defaultValue={session?.phaseLabel ?? ''}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (opsional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={session?.description ?? ''}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Jadwal (opsional)</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={session?.scheduledAt ?? ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeLimitMinutes">Durasi (menit)</Label>
              <Input
                id="timeLimitMinutes"
                name="timeLimitMinutes"
                type="number"
                min={10}
                defaultValue={session?.timeLimitMinutes ?? 120}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Urutan tampil</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={session?.sortOrder ?? 0}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={session?.isActive ?? true}
              className="size-4 rounded border-border"
            />
            Aktifkan untuk siswa
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link href={ADMIN_ROUTES.tryoutSessions}>Batal</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? 'Simpan Perubahan' : 'Buat Sesi'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageShell>
  );
}
