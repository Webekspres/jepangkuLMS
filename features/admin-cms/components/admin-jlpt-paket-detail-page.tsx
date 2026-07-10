'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImageIcon, Loader2, Lock, Plus, Trash2, Upload } from 'lucide-react';
import {
  createChokaiInSetAction,
  createQuestionInSetAction,
  removeSetItemAction,
  setJlptQuestionSetStatusAction,
  updateJlptQuestionSetMetaAction,
} from '@/features/admin-cms/actions/cms-jlpt-question-set-actions';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import type { AdminJlptQuestionSetDetail } from '@/features/admin-cms/lib/load-admin-jlpt-question-sets';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const SECTION_LABELS: Record<string, string> = {
  MOJI_GOI: 'Moji Goi',
  BUNPOU_DOKKAI: 'Bunpou Dokkai',
  CHOKAI: 'Choukai',
};

function emptyOptions() {
  return [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ];
}

function OptionsEditor({
  options,
  correctIndex,
  name,
  onOptionsChange,
  onCorrectChange,
}: {
  options: { text: string; isCorrect: boolean }[];
  correctIndex: string;
  name: string;
  onOptionsChange: (next: { text: string; isCorrect: boolean }[]) => void;
  onCorrectChange: (index: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Opsi — pilih yang benar</Label>
      {options.map((opt, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="radio"
            name={name}
            checked={correctIndex === String(index)}
            onChange={() => onCorrectChange(String(index))}
          />
          <Input
            value={opt.text}
            placeholder={`Opsi ${index + 1}`}
            onChange={(e) =>
              onOptionsChange(
                options.map((row, i) => (i === index ? { ...row, text: e.target.value } : row)),
              )
            }
          />
        </div>
      ))}
    </div>
  );
}

function MojiBunpouForm({
  section,
  locked,
  disabled,
  onSubmit,
}: {
  section: 'MOJI_GOI' | 'BUNPOU_DOKKAI';
  locked: boolean;
  disabled: boolean;
  onSubmit: (data: {
    questionText: string;
    explanation: string;
    options: { text: string; isCorrect: boolean }[];
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState(emptyOptions);
  const [correctIndex, setCorrectIndex] = useState('0');

  if (locked) return null;
  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Tambah soal
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <div className="space-y-2">
        <Label>Pertanyaan</Label>
        <Textarea
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Teks soal…"
        />
      </div>
      <OptionsEditor
        name={`correct-${section}`}
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
      <div className="space-y-2">
        <Label>Penjelasan (opsional)</Label>
        <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={() => {
            onSubmit({
              questionText,
              explanation,
              options: options.map((o, i) => ({
                text: o.text,
                isCorrect: String(i) === correctIndex,
              })),
            });
            setQuestionText('');
            setExplanation('');
            setOptions(emptyOptions());
            setCorrectIndex('0');
            setOpen(false);
          }}
        >
          Simpan soal
        </Button>
      </div>
    </div>
  );
}

function ChokaiForm({
  level,
  locked,
  disabled,
  onSubmit,
}: {
  level: string;
  locked: boolean;
  disabled: boolean;
  onSubmit: (data: {
    questionText: string;
    explanation: string;
    instructionText: string;
    options: { text: string; isCorrect: boolean }[];
    audioUrl: string;
    imageUrl: string | null;
  }) => void;
}) {
  const audioRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [instructionText, setInstructionText] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [options, setOptions] = useState(emptyOptions);
  const [correctIndex, setCorrectIndex] = useState('0');

  async function uploadAudio(file: File) {
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      toast.error('Audio harus .mp3');
      return;
    }
    setUploadingAudio(true);
    try {
      const form = new FormData();
      form.set('file', file);
      const res = await fetch('/api/admin/tryout/upload-audio', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      const json = (await res.json()) as { ok: boolean; url?: string; message?: string };
      if (!json.ok || !json.url) {
        toast.error(json.message ?? 'Upload audio gagal');
        return;
      }
      setAudioUrl(json.url);
      toast.success('Audio terunggah');
    } catch {
      toast.error('Upload audio gagal');
    } finally {
      setUploadingAudio(false);
    }
  }

  async function uploadImage(file: File) {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('level', level);
      form.set('code', `chokai-${Date.now()}`);
      const res = await fetch('/api/admin/tryout/upload-image', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      const json = (await res.json()) as { ok: boolean; url?: string; message?: string };
      if (!json.ok || !json.url) {
        toast.error(json.message ?? 'Upload gambar gagal');
        return;
      }
      setImageUrl(json.url);
      toast.success('Gambar stimulus terunggah');
    } catch {
      toast.error('Upload gambar gagal');
    } finally {
      setUploadingImage(false);
    }
  }

  if (locked) return null;
  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Tambah Choukai
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      <div className="space-y-2">
        <Label>Audio (.mp3) *</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingAudio || disabled}
            onClick={() => audioRef.current?.click()}
          >
            {uploadingAudio ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Unggah audio
          </Button>
          <input
            ref={audioRef}
            type="file"
            accept=".mp3,audio/mpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadAudio(f);
            }}
          />
        </div>
        {audioUrl ? (
          <audio controls preload="none" className="w-full" src={audioUrl}>
            <track kind="captions" />
          </audio>
        ) : (
          <p className="text-xs text-muted-foreground">Wajib — siswa mendengar dari sini.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Gambar stimulus (opsional)</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingImage || disabled}
            onClick={() => imageRef.current?.click()}
          >
            {uploadingImage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageIcon className="size-4" />
            )}
            Unggah gambar
          </Button>
          <input
            ref={imageRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadImage(f);
            }}
          />
          {imageUrl ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrl(null)}>
              Hapus gambar
            </Button>
          ) : null}
        </div>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Stimulus Choukai"
            className="max-h-40 rounded-md border border-border object-contain"
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Instruksi (opsional)</Label>
        <Input
          value={instructionText}
          onChange={(e) => setInstructionText(e.target.value)}
          placeholder="Mis. Pilih gambar yang sesuai…"
        />
      </div>

      <div className="space-y-2">
        <Label>Pertanyaan</Label>
        <Textarea
          rows={2}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="どれですか。"
        />
      </div>

      <OptionsEditor
        name="correct-chokai"
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />

      <div className="space-y-2">
        <Label>Penjelasan (opsional)</Label>
        <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={disabled || uploadingAudio || uploadingImage}
          onClick={() => {
            onSubmit({
              questionText,
              explanation,
              instructionText,
              audioUrl,
              imageUrl,
              options: options.map((o, i) => ({
                text: o.text,
                isCorrect: String(i) === correctIndex,
              })),
            });
            setQuestionText('');
            setExplanation('');
            setInstructionText('');
            setAudioUrl('');
            setImageUrl(null);
            setOptions(emptyOptions());
            setCorrectIndex('0');
            setOpen(false);
          }}
        >
          Simpan Choukai
        </Button>
      </div>
    </div>
  );
}

export function AdminJlptPaketDetailPage({ detail }: { detail: AdminJlptQuestionSetDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locked = detail.stats.isContentLocked;

  const itemsBySection = useMemo(() => {
    const map: Record<string, typeof detail.items> = {
      MOJI_GOI: [],
      BUNPOU_DOKKAI: [],
      CHOKAI: [],
    };
    for (const item of detail.items) {
      (map[item.section] ??= []).push(item);
    }
    return map;
  }, [detail]);

  function handleMeta(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateJlptQuestionSetMetaAction(detail.id, formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Judul disimpan');
      router.refresh();
    });
  }

  function handleStatus(status: 'DRAFT' | 'READY' | 'ARCHIVED') {
    startTransition(async () => {
      const result = await setJlptQuestionSetStatusAction(detail.id, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(status === 'READY' ? 'Paket siap dipakai sesi' : `Status → ${status}`);
      router.refresh();
    });
  }

  function handleCreateMojiBunpou(
    section: 'MOJI_GOI' | 'BUNPOU_DOKKAI',
    data: {
      questionText: string;
      explanation: string;
      options: { text: string; isCorrect: boolean }[];
    },
  ) {
    startTransition(async () => {
      const result = await createQuestionInSetAction({
        questionSetId: detail.id,
        section,
        ...data,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Soal ditambahkan');
      router.refresh();
    });
  }

  function handleCreateChokai(data: {
    questionText: string;
    explanation: string;
    instructionText: string;
    options: { text: string; isCorrect: boolean }[];
    audioUrl: string;
    imageUrl: string | null;
  }) {
    startTransition(async () => {
      const result = await createChokaiInSetAction({
        questionSetId: detail.id,
        questionText: data.questionText,
        explanation: data.explanation,
        instructionText: data.instructionText,
        options: data.options,
        audioUrl: data.audioUrl,
        imageUrl: data.imageUrl,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Soal Choukai ditambahkan');
      router.refresh();
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      const result = await removeSetItemAction(itemId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Soal dihapus dari paket');
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title={detail.title}
      subtitle={`${detail.level} · ${detail.stats.totalQuestions} soal · ${detail.stats.jlptCompleteness.label} bagian lengkap`}
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.tryoutPaket}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      {locked ? (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Lock className="size-4 text-amber-600" />
            Paket terkunci — dipakai {detail.stats.activeSessionCount} sesi aktif
          </p>
          <p className="mt-1 text-muted-foreground">
            Nonaktifkan sesi dulu, atau duplikat paket untuk mengedit isi.
          </p>
        </Card>
      ) : null}

      <Card className="mb-4 border-border p-4">
        <form onSubmit={handleMeta} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="title">Judul paket</Label>
            <Input id="title" name="title" defaultValue={detail.title} required />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={detail.status === 'READY' ? 'default' : 'secondary'}>
              {detail.status}
            </Badge>
            <Button type="submit" size="sm" disabled={isPending}>
              Simpan
            </Button>
            {detail.status !== 'READY' ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() => handleStatus('READY')}
              >
                Siap dipakai
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleStatus('ARCHIVED')}
              >
                Arsipkan
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {(['MOJI_GOI', 'BUNPOU_DOKKAI'] as const).map((section) => (
          <Card key={section} className="border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{SECTION_LABELS[section]}</h3>
              <span className="text-xs text-muted-foreground">
                {(itemsBySection[section] ?? []).reduce((n, i) => n + i.questionCount, 0)} soal
              </span>
            </div>
            <ul className="space-y-2">
              {(itemsBySection[section] ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">Belum ada soal.</li>
              ) : (
                (itemsBySection[section] ?? []).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="min-w-0 flex-1 wrap-break-word">{item.label}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={isPending || locked}
                      onClick={() => handleRemove(item.id)}
                      aria-label="Hapus"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                ))
              )}
            </ul>
            <MojiBunpouForm
              section={section}
              locked={locked}
              disabled={isPending}
              onSubmit={(data) => handleCreateMojiBunpou(section, data)}
            />
          </Card>
        ))}

        <Card className="border-border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">{SECTION_LABELS.CHOKAI}</h3>
            <span className="text-xs text-muted-foreground">
              {(itemsBySection.CHOKAI ?? []).reduce((n, i) => n + i.questionCount, 0)} soal
            </span>
          </div>
          <ul className="space-y-2">
            {(itemsBySection.CHOKAI ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">Belum ada soal.</li>
            ) : (
              (itemsBySection.CHOKAI ?? []).map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 wrap-break-word">{item.label}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={isPending || locked}
                    onClick={() => handleRemove(item.id)}
                    aria-label="Hapus"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))
            )}
          </ul>
          <ChokaiForm
            level={detail.level}
            locked={locked}
            disabled={isPending}
            onSubmit={handleCreateChokai}
          />
        </Card>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Banyak soal sekaligus?{' '}
        <Link className="underline" href={ADMIN_ROUTES.tryoutPaketImport}>
          Import ZIP
        </Link>
      </p>
    </AdminPageShell>
  );
}
