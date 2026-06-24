'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createLiveClassAction,
  updateLiveClassAction,
} from '@/features/admin-cms/actions/cms-live-class-actions';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const CATEGORIES = ['Tata Bahasa', 'Kosa Kata', 'Kanji', 'Speaking', 'JLPT Tips'] as const;
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

type LiveClassFormData = {
  id?: string;
  title: string;
  description: string;
  senseiName: string;
  senseiLevel: string | null;
  category: string;
  level: string;
  scheduledAt: string;
  endsAt: string;
  maxSlots: number;
  filledSlots: number;
  thumbUrl: string | null;
  meetingUrl: string | null;
  isPublished: boolean;
};

export function AdminLiveClassFormPage({ liveClass }: { liveClass?: LiveClassFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(liveClass?.level ?? 'N5');
  const [category, setCategory] = useState(liveClass?.category ?? CATEGORIES[0]);
  const isEdit = Boolean(liveClass?.id);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set('level', level);
    formData.set('category', category);

    startTransition(async () => {
      const result = isEdit
        ? await updateLiveClassAction(liveClass!.id!, formData)
        : await createLiveClassAction(formData);

      if (!result.ok) {
        setError(result.message);
        toast.error(result.message);
        return;
      }
      toast.success(isEdit ? 'Live class diperbarui' : 'Live class dibuat');
      router.push(ADMIN_ROUTES.liveClass);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title={isEdit ? 'Edit Live Class' : 'Jadwalkan Live Class'}
      subtitle="Sesi tampil di halaman Live Class siswa setelah dipublikasikan."
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.liveClass}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      <Card className="max-w-2xl border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Kelas</Label>
            <Input id="title" name="title" defaultValue={liveClass?.title ?? ''} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={liveClass?.description ?? ''}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="senseiName">Nama Sensei</Label>
              <Input id="senseiName" name="senseiName" defaultValue={liveClass?.senseiName ?? ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senseiLevel">Level Sensei (opsional)</Label>
              <Input
                id="senseiLevel"
                name="senseiLevel"
                placeholder="N1 Native"
                defaultValue={liveClass?.senseiLevel ?? ''}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level JLPT</Label>
              <Select value={level} onValueChange={setLevel}>
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Mulai</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={liveClass?.scheduledAt ?? ''}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endsAt">Selesai (opsional)</Label>
              <Input
                id="endsAt"
                name="endsAt"
                type="datetime-local"
                defaultValue={liveClass?.endsAt ?? ''}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxSlots">Kapasitas</Label>
              <Input
                id="maxSlots"
                name="maxSlots"
                type="number"
                min={1}
                defaultValue={liveClass?.maxSlots ?? 30}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filledSlots">Peserta terisi</Label>
              <Input
                id="filledSlots"
                name="filledSlots"
                type="number"
                min={0}
                defaultValue={liveClass?.filledSlots ?? 0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbUrl">URL Thumbnail (opsional)</Label>
            <Input
              id="thumbUrl"
              name="thumbUrl"
              type="url"
              placeholder="https://…"
              defaultValue={liveClass?.thumbUrl ?? ''}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingUrl">Link Zoom / Meeting</Label>
            <Input
              id="meetingUrl"
              name="meetingUrl"
              type="url"
              placeholder="https://zoom.us/j/…"
              defaultValue={liveClass?.meetingUrl ?? ''}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={liveClass?.isPublished ?? true}
              className="size-4 rounded border-border"
            />
            Publikasikan ke siswa
          </label>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" asChild>
              <Link href={ADMIN_ROUTES.liveClass}>Batal</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? 'Simpan Perubahan' : 'Buat Jadwal'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageShell>
  );
}
