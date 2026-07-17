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
import { ADMIN_FORM_CARD_CLASS } from '@/features/admin-cms/lib/admin-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RupiahInput } from '@/components/ui/rupiah-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateSlug } from '@/lib/string-helpers';
import { cn } from '@/lib/utils';
import type { LevelJLPT } from '@prisma/client';
import { toast } from 'sonner';

const LEVELS: LevelJLPT[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

type TryoutFormData = {
  id?: string;
  code: string;
  title: string;
  phaseLabel: string;
  level: LevelJLPT;
  description: string | null;
  scheduledAt: string;
  timeLimitMinutes: number;
  isActive: boolean;
  sortOrder: number;
  priceIdr: number;
  isStrictTimeBound: boolean;
  questionSetId?: string | null;
};

type PackageOption = {
  id: string;
  code: string;
  title: string;
  level: LevelJLPT;
  completeness: { label: string; isComplete: boolean };
  totalQuestions: number;
};

export function AdminTryoutSessionFormPage({
  session,
  packages = [],
}: {
  session?: TryoutFormData;
  packages?: PackageOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isStrict, setIsStrict] = useState(session?.isStrictTimeBound ?? false);
  const isEdit = Boolean(session?.id);

  const [title, setTitle] = useState(session?.title ?? '');
  const [level, setLevel] = useState<LevelJLPT>(session?.level ?? 'N5');
  const [questionSetId, setQuestionSetId] = useState(session?.questionSetId ?? '__none__');

  const packagesForLevel = packages.filter((p) => p.level === level);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    // Hidden internals — admin tidak perlu isi
    formData.set('code', session?.code || generateSlug(title));
    formData.set('phaseLabel', title);
    formData.set('sortOrder', String(session?.sortOrder ?? 0));
    formData.set('level', level);
    formData.set('questionSetId', questionSetId);

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
      title={isEdit ? 'Edit Sesi' : 'Sesi Baru'}
      subtitle="Pilih paket soal, atur durasi & harga, lalu aktifkan."
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.tryoutSessions}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      <Card className={cn(ADMIN_FORM_CARD_CLASS, 'p-6')}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Simulasi JLPT N5 — Juli 2026"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select
                value={level}
                onValueChange={(value) => {
                  const next = value as LevelJLPT;
                  setLevel(next);
                  const stillValid = packages.some(
                    (p) => p.id === questionSetId && p.level === next,
                  );
                  if (!stillValid) setQuestionSetId('__none__');
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((lv) => (
                    <SelectItem key={lv} value={lv}>
                      {lv}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Label>Paket Soal</Label>
            <Select value={questionSetId} onValueChange={setQuestionSetId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih paket…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Belum dipilih —</SelectItem>
                {packagesForLevel.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.title}
                    {!pkg.completeness.isComplete ? ` (${pkg.completeness.label})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {packagesForLevel.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Belum ada paket READY untuk {level}.{' '}
                <Link className="underline" href={ADMIN_ROUTES.tryoutPaketForm}>
                  Buat paket dulu
                </Link>
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceIdr">Harga (Rp)</Label>
            <RupiahInput id="priceIdr" name="priceIdr" defaultValue={session?.priceIdr ?? 0} />
            <p className="text-xs text-muted-foreground">Isi 0 jika gratis.</p>
          </div>

          <div className="space-y-2">
            <Label>Akses</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsStrict(false)}
                className={
                  'rounded-lg border-2 p-3 text-left text-sm transition-all ' +
                  (!isStrict
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40')
                }
              >
                <p className="font-semibold">Latihan bebas</p>
                <p className="text-xs text-muted-foreground">Kapan saja</p>
              </button>
              <button
                type="button"
                onClick={() => setIsStrict(true)}
                className={
                  'rounded-lg border-2 p-3 text-left text-sm transition-all ' +
                  (isStrict
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40')
                }
              >
                <p className="font-semibold">Jadwal ketat</p>
                <p className="text-xs text-muted-foreground">Hanya di jam terjadwal</p>
              </button>
            </div>
            {isStrict ? <input type="hidden" name="isStrictTimeBound" value="on" /> : null}
            {isStrict ? (
              <div className="space-y-2 pt-1">
                <Label htmlFor="scheduledAt">Jadwal mulai</Label>
                <Input
                  id="scheduledAt"
                  name="scheduledAt"
                  type="datetime-local"
                  defaultValue={session?.scheduledAt ?? ''}
                />
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={session?.isActive ?? false}
              className="size-4 rounded border-border"
            />
            Aktifkan untuk siswa
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" asChild>
              <Link href={ADMIN_ROUTES.tryoutSessions}>Batal</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? 'Simpan' : 'Buat Sesi'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageShell>
  );
}
