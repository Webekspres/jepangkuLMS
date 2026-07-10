'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createJlptQuestionSetAction } from '@/features/admin-cms/actions/cms-jlpt-question-set-actions';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
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
import type { LevelJLPT } from '@prisma/client';
import { toast } from 'sonner';

const LEVELS: LevelJLPT[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

export function AdminJlptPaketFormPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [level, setLevel] = useState<LevelJLPT>('N5');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set('level', level);

    startTransition(async () => {
      const result = await createJlptQuestionSetAction(formData);
      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success('Paket dibuat — lanjut isi soal');
      if (result.id) router.push(ADMIN_ROUTES.tryoutPaketDetail(result.id));
      else router.push(ADMIN_ROUTES.tryoutPaket);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title="Paket Soal Baru"
      subtitle="Isi judul & level, lalu langsung buat soal di dalam paket."
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.tryoutPaket}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      <Card className="max-w-md border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul paket</Label>
            <Input id="title" name="title" placeholder="Paket N5 A" required />
          </div>
          <div className="space-y-2">
            <Label>Level JLPT</Label>
            <Select value={level} onValueChange={(v) => setLevel(v as LevelJLPT)}>
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
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={ADMIN_ROUTES.tryoutPaket}>Batal</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              Buat & isi soal
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageShell>
  );
}
