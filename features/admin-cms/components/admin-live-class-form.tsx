'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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
import { RupiahInput } from '@/components/ui/rupiah-input';
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

type LiveClassSessionData = {
  id?: string;
  title: string;
  scheduledAt: string;
  endsAt: string;
  meetingUrl: string | null;
  recordingUrl: string | null;
};

type LiveClassFormData = {
  id?: string;
  title: string;
  description: string;
  senseiName: string;
  senseiLevel: string | null;
  category: string;
  level: string;
  priceIdr: number;
  maxSlots: number;
  filledSlots: number;
  thumbUrl: string | null;
  paymentLink: string | null;
  isPublished: boolean;
  sessions: LiveClassSessionData[];
};

function emptySession(): LiveClassSessionData {
  return { title: '', scheduledAt: '', endsAt: '', meetingUrl: '', recordingUrl: '' };
}

export function AdminLiveClassFormPage({ liveClass }: { liveClass?: LiveClassFormData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(liveClass?.level ?? 'N5');
  const [category, setCategory] = useState(liveClass?.category ?? CATEGORIES[0]);
  const [sessions, setSessions] = useState<LiveClassSessionData[]>(
    liveClass?.sessions?.length ? liveClass.sessions : [emptySession()],
  );
  const isEdit = Boolean(liveClass?.id);

  function updateSession(index: number, patch: Partial<LiveClassSessionData>) {
    setSessions((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addSession() {
    setSessions((prev) => [...prev, emptySession()]);
  }

  function removeSession(index: number) {
    setSessions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    formData.set('level', level);
    formData.set('category', category);
    formData.set('sessionsJson', JSON.stringify(sessions));

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
      subtitle="Program tampil di halaman Live Class siswa beserta seluruh pertemuannya setelah dipublikasikan."
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
            <Label htmlFor="title">Judul Program</Label>
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="priceIdr">Harga (Rp)</Label>
              <RupiahInput id="priceIdr" name="priceIdr" defaultValue={liveClass?.priceIdr ?? 0} />
            </div>
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
            <Label htmlFor="paymentLink">Link Pembayaran (opsional)</Label>
            <Input
              id="paymentLink"
              name="paymentLink"
              type="url"
              placeholder="https://…"
              defaultValue={liveClass?.paymentLink ?? ''}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Pertemuan (Sesi)</Label>
                <p className="text-xs text-muted-foreground">
                  Tambahkan satu atau lebih jadwal pertemuan untuk program ini.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addSession}>
                <Plus className="size-4" />
                Tambah
              </Button>
            </div>

            {sessions.map((session, index) => (
              <div key={index} className="space-y-3 rounded-md border border-border/60 bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Pertemuan {index + 1}
                  </span>
                  {sessions.length > 1 ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon-sm"
                      aria-label="Hapus pertemuan"
                      title="Hapus pertemuan"
                      onClick={() => removeSession(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label>Judul Pertemuan</Label>
                  <Input
                    value={session.title}
                    placeholder="Pertemuan 1 — Pengantar"
                    onChange={(e) => updateSession(index, { title: e.target.value })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mulai</Label>
                    <Input
                      type="datetime-local"
                      value={session.scheduledAt}
                      onChange={(e) => updateSession(index, { scheduledAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selesai</Label>
                    <Input
                      type="datetime-local"
                      value={session.endsAt}
                      onChange={(e) => updateSession(index, { endsAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Link Zoom / Meeting</Label>
                    <Input
                      type="url"
                      placeholder="https://zoom.us/j/…"
                      value={session.meetingUrl ?? ''}
                      onChange={(e) => updateSession(index, { meetingUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link Rekaman (opsional)</Label>
                    <Input
                      type="url"
                      placeholder="https://…"
                      value={session.recordingUrl ?? ''}
                      onChange={(e) => updateSession(index, { recordingUrl: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
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
              {isEdit ? 'Simpan Perubahan' : 'Buat Program'}
            </Button>
          </div>
        </form>
      </Card>
    </AdminPageShell>
  );
}
