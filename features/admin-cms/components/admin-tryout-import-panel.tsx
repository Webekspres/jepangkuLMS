'use client';

import { useRef, useState } from 'react';
import { Download, FileUp, Loader2, Upload } from 'lucide-react';
import type { LevelJLPT } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ImportResult = {
  ok: boolean;
  message: string;
  imported?: number;
  errors?: { row: number; message: string }[];
  sectionCounts?: Record<string, number>;
};

type AdminTryoutImportPanelProps = {
  sessionId: string;
  level: LevelJLPT;
  onImported: () => void;
};

export function AdminTryoutImportPanel({
  sessionId,
  level,
  onImported,
}: AdminTryoutImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function runImport(file: File) {
    setPending(true);
    setResult(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.set('file', file);
    formData.set('sessionId', sessionId);
    formData.set('level', level);

    try {
      const response = await fetch('/api/admin/tryout/import', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });
      const json = (await response.json()) as ImportResult;
      setResult(json);
      if (json.ok) {
        toast.success(json.message);
        onImported();
      } else {
        toast.error(json.message);
      }
    } catch {
      const fail = { ok: false, message: 'Gagal mengunggah file.' };
      setResult(fail);
      toast.error(fail.message);
    } finally {
      setPending(false);
    }
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      toast.error('Format harus .csv atau .xlsx');
      return;
    }
    void runImport(file);
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Impor Massal (.csv / .xlsx)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Kolom: No, Section, QuestionText, Explanation, Options (\\n), CorrectOptionIndex, AudioUrl, AudioGroupId
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <a href="/api/admin/tryout/template?format=csv" download>
              <Download className="size-4" />
              Template CSV
            </a>
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href="/api/admin/tryout/template?format=xlsx" download>
              <Download className="size-4" />
              Template Excel
            </a>
          </Button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30',
            pending && 'pointer-events-none opacity-60',
          )}
        >
          {pending ? (
            <Loader2 className="size-8 animate-spin text-primary" />
          ) : (
            <FileUp className="size-8 text-muted-foreground" />
          )}
          <p className="text-sm font-medium text-foreground">
            {pending ? 'Mengimpor…' : 'Seret file atau klik untuk unggah'}
          </p>
          <p className="text-xs text-muted-foreground">Level {level} · maks. disarankan &lt; 500 baris</p>
          {fileName ? <p className="text-xs font-medium text-primary">{fileName}</p> : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {result ? (
          <div
            className={cn(
              'rounded-lg border px-3 py-2 text-sm',
              result.ok
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200'
                : 'border-destructive/30 bg-destructive/5 text-destructive',
            )}
          >
            <p className="font-medium">{result.message}</p>
            {result.sectionCounts ? (
              <p className="mt-1 text-xs opacity-80">
                MOJI_GOI: {result.sectionCounts.MOJI_GOI ?? 0} · BUNPOU:{' '}
                {result.sectionCounts.BUNPOU_DOKKAI ?? 0} · CHOKAI: {result.sectionCounts.CHOKAI ?? 0}
              </p>
            ) : null}
            {result.errors && result.errors.length > 0 ? (
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
                {result.errors.map((err) => (
                  <li key={`${err.row}-${err.message}`}>
                    Baris {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={pending || !fileName}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          Pilih File Lain
        </Button>
      </CardContent>
    </Card>
  );
}
