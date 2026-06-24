'use client';

import { useRef, useState } from 'react';
import { Loader2, Music, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export type ChokaiAudioFormValue = {
  audioMode: 'single' | 'group';
  audioUrl: string;
  audioGroupId: string;
};

type AdminTryoutChokaiAudioFormProps = {
  value: ChokaiAudioFormValue;
  onChange: (next: ChokaiAudioFormValue) => void;
  disabled?: boolean;
};

export function AdminTryoutChokaiAudioForm({
  value,
  onChange,
  disabled,
}: AdminTryoutChokaiAudioFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      toast.error('Hanya file .mp3 yang didukung.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.set('file', file);

    try {
      const response = await fetch('/api/admin/tryout/upload-audio', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      const json = (await response.json()) as { ok: boolean; url?: string; message?: string };
      if (!json.ok || !json.url) {
        toast.error(json.message ?? 'Upload audio gagal.');
        return;
      }
      onChange({ ...value, audioUrl: json.url });
      toast.success('Audio berhasil diunggah ke R2.');
    } catch {
      toast.error('Upload audio gagal.');
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    void uploadFile(file);
  }

  return (
    <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">Audio Chokai</p>
        <p className="text-xs text-muted-foreground">
          Unggah .mp3 ke R2 — satu audio per soal, atau satu audio untuk beberapa soal (grup).
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...value, audioMode: 'single', audioGroupId: '' })}
          className={cn(
            'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
            value.audioMode === 'single'
              ? 'border-primary bg-card shadow-sm'
              : 'border-border bg-background hover:bg-muted/40',
          )}
        >
          <p className="font-medium">Single Audio</p>
          <p className="text-xs text-muted-foreground">Satu pemutar per soal ini.</p>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...value, audioMode: 'group' })}
          className={cn(
            'rounded-xl border px-3 py-2 text-left text-sm transition-colors',
            value.audioMode === 'group'
              ? 'border-primary bg-card shadow-sm'
              : 'border-border bg-background hover:bg-muted/40',
          )}
        >
          <p className="font-medium">Group Audio</p>
          <p className="text-xs text-muted-foreground">Satu audio untuk beberapa soal (mis. 1–7).</p>
        </button>
      </div>

      {value.audioMode === 'group' ? (
        <div className="space-y-2">
          <Label htmlFor="audioGroupId">Audio Group ID / Code</Label>
          <Input
            id="audioGroupId"
            placeholder="contoh: n5-chokai-set-1"
            value={value.audioGroupId}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, audioGroupId: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Soal lain dengan kode identik akan memakai satu pemutar audio global.
          </p>
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!uploading && !disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !uploading && !disabled && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
          (uploading || disabled) && 'pointer-events-none opacity-60',
        )}
      >
        {uploading ? (
          <Loader2 className="size-7 animate-spin text-primary" />
        ) : (
          <Upload className="size-7 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          {uploading ? 'Mengunggah ke R2…' : 'Seret file .mp3 atau klik untuk unggah'}
        </p>
        <p className="text-xs text-muted-foreground">Maks. 15 MB · audio/mpeg</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,.mp3"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="space-y-2">
        <Label htmlFor="audioUrl">URL audio (R2)</Label>
        <div className="flex gap-2">
          <Input
            id="audioUrl"
            type="url"
            placeholder="https://…/tryouts/chokai/….mp3"
            value={value.audioUrl}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, audioUrl: e.target.value })}
          />
          {value.audioUrl ? <Music className="mt-2.5 size-4 shrink-0 text-emerald-600" /> : null}
        </div>
        {value.audioUrl ? (
          <audio controls preload="none" className="w-full" src={value.audioUrl}>
            <track kind="captions" />
          </audio>
        ) : null}
      </div>
    </div>
  );
}
