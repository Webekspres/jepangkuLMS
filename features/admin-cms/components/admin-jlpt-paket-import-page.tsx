'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, FileUp, Loader2, Upload } from 'lucide-react';
import type { JlptPaketImportPreview } from '@/features/admin-cms/lib/import-jlpt-bank-zip';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type PreviewApiResponse = {
  ok: boolean;
  preview?: JlptPaketImportPreview;
  message?: string;
};

type ImportApiResponse = {
  ok: boolean;
  message: string;
  errors?: string[];
  packageCode?: string;
  packageId?: string;
};

export function AdminJlptPaketImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<JlptPaketImportPreview | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isPreviewPending, startPreviewTransition] = useTransition();
  const [isImportPending, startImportTransition] = useTransition();

  const handleFile = (next: File | null) => {
    if (!next) return;
    if (!next.name.toLowerCase().endsWith('.zip')) {
      setMessage({ type: 'error', text: 'Format harus .zip (workbook.xlsx + audio/ + images/).' });
      return;
    }
    if (next.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'ZIP maksimal 50 MB.' });
      return;
    }
    setFile(next);
    setPreview(null);
    setMessage(null);
  };

  const handlePreview = () => {
    if (!file) return;
    setMessage(null);
    startPreviewTransition(async () => {
      const formData = new FormData();
      formData.set('file', file);
      const res = await fetch('/api/admin/tryout/bank-import?dryRun=1', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as PreviewApiResponse;
      if (!data.preview) {
        setPreview(null);
        setMessage({
          type: 'error',
          text: data.message ?? 'Pratinjau gagal. Periksa file ZIP.',
        });
        toast.error(data.message ?? 'Pratinjau gagal.');
        return;
      }
      setPreview(data.preview);
      if (!data.preview.ok) {
        setMessage({
          type: 'error',
          text: 'Paket belum valid. Perbaiki error di bawah sebelum mengimpor.',
        });
      }
    });
  };

  const handleImport = () => {
    if (!file || !preview?.ok) return;
    setMessage(null);
    startImportTransition(async () => {
      const formData = new FormData();
      formData.set('file', file);
      const res = await fetch('/api/admin/tryout/bank-import', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as ImportApiResponse;
      if (!data.ok) {
        toast.error(data.message);
        setMessage({ type: 'error', text: data.message });
        if (data.errors?.length) {
          setPreview((prev) =>
            prev
              ? {
                  ...prev,
                  ok: false,
                  errors: [
                    ...prev.errors,
                    ...data.errors!.filter((err) => !prev.errors.includes(err)),
                  ],
                }
              : prev,
          );
        }
        return;
      }
      toast.success(data.message);
      if (data.packageId) {
        router.push(ADMIN_ROUTES.tryoutPaketDetail(data.packageId));
      } else {
        router.push(ADMIN_ROUTES.tryoutPaket);
      }
      router.refresh();
    });
  };

  const canImport = Boolean(preview?.ok && file);

  return (
    <AdminPageShell
      label="Program"
      title="Import Paket Soal"
      subtitle="Unggah ZIP template (satu paket per file). Pratinjau dulu, lalu impor ke database."
      backHref={ADMIN_ROUTES.tryoutPaket}
    >
      {message ? (
        <p
          className={cn(
            'mb-6 rounded-lg border px-4 py-3 text-sm',
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-destructive/30 bg-destructive/5 text-destructive',
          )}
        >
          {message.text}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="border-border p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />

          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/30',
            )}
          >
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Seret file .zip atau klik untuk memilih</p>
            {file ? <p className="text-xs font-medium text-primary">{file.name}</p> : null}
            <p className="text-xs text-muted-foreground">Maks. 50 MB · workbook.xlsx + audio/ + images/</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={!file || isPreviewPending || isImportPending}
            >
              {isPreviewPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              Pratinjau
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={!canImport || isImportPending || isPreviewPending}
            >
              {isImportPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Impor ke Database
            </Button>
          </div>
        </Card>

        <Card className="h-fit border-border p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Panduan impor</h2>
          <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
            <li>
              Unduh{' '}
              <a
                href="/api/admin/tryout/bank-template"
                className="font-medium text-brand-red hover:underline"
              >
                template ZIP
              </a>{' '}
              lalu buka <strong>workbook.xlsx</strong> — mulai dari tab <strong>001. Panduan</strong>.
            </li>
            <li>
              Isi <strong>002. Paket</strong> (satu baris), lalu soal per bagian:{' '}
              <strong>004. Moji Goi</strong>, <strong>005. Bunpou Dokkai</strong>,{' '}
              <strong>006. Choukai</strong> — tiap baris sudah termasuk pilihan A–D + Jawaban Benar.
            </li>
            <li>
              Choukai: isi <strong>003. Audio Chokai</strong> + MP3 di{' '}
              <code className="text-[10px]">audio/</code>. Gambar scene → kolom{' '}
              <strong>Gambar Stimulus</strong> di tab Choukai.
            </li>
            <li>
              Dropdown untuk Level / Status / Bagian / Jawaban Benar (A–D). Kode sederhana:{' '}
              <code className="text-[10px]">n5-paket-1</code>, <code className="text-[10px]">n5-soal-1</code>.
            </li>
            <li>Jika kode paket sudah ada, isi item diganti (replace) — kecuali paket dipakai sesi aktif.</li>
            <li>Lanjut impor hanya setelah pratinjau valid (hijau “Siap diimpor”).</li>
          </ol>
          <Button asChild variant="outline" size="sm" className="mt-4 w-full">
            <a href="/api/admin/tryout/bank-template">
              <Download className="size-4" />
              Unduh template ZIP
            </a>
          </Button>
        </Card>
      </div>

      {preview ? (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap gap-3">
            {preview.packageCode ? (
              <Badge variant="outline">Kode: {preview.packageCode}</Badge>
            ) : null}
            {preview.packageLevel ? (
              <Badge variant="outline">{preview.packageLevel}</Badge>
            ) : null}
            <Badge variant="secondary">Status: {preview.packageStatus}</Badge>
            <Badge variant="secondary">{preview.questionCount} soal</Badge>
            <Badge variant="secondary">{preview.optionCount} opsi</Badge>
            <Badge variant="secondary">{preview.stimulusCount} stimulus</Badge>
            <Badge variant="secondary">Moji {preview.mojiCount}</Badge>
            <Badge variant="secondary">Bunpou {preview.bunpouCount}</Badge>
            <Badge variant="secondary">Choukai {preview.chokaiCount}</Badge>
            <Badge variant="secondary">Audio {preview.audioFileCount}</Badge>
            <Badge variant="secondary">Gambar {preview.imageFileCount}</Badge>
            <Badge variant="secondary">JLPT {preview.jlptCompleteness}</Badge>
            {preview.willReplace ? <Badge variant="outline">Replace item</Badge> : null}
            {preview.ok ? (
              <Badge className="bg-emerald-600 hover:bg-emerald-600">Siap diimpor</Badge>
            ) : (
              <Badge variant="destructive">Ada error</Badge>
            )}
          </div>

          {preview.packageTitle ? (
            <p className="text-sm text-foreground">
              <span className="text-muted-foreground">Judul paket: </span>
              <span className="font-medium">{preview.packageTitle}</span>
              {preview.existingPackageId ? (
                <span className="text-muted-foreground">
                  {' '}
                  · sudah ada di database
                  {preview.willReplace ? ' (item akan diganti)' : ''}
                </span>
              ) : (
                <span className="text-muted-foreground"> · paket baru</span>
              )}
            </p>
          ) : null}

          {preview.errors.length > 0 ? (
            <Card className="border-destructive/30 p-4">
              <h3 className="mb-2 text-sm font-semibold text-destructive">Perlu diperbaiki</h3>
              <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-destructive">
                {preview.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {preview.warnings.length > 0 ? (
            <Card className="border-amber-200 bg-amber-50/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-amber-900">Perhatian</h3>
              <ul className="space-y-1 text-sm text-amber-900">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {preview.questionCount > 0 ? (
            <Card className="overflow-hidden border-border">
              <div className="border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold text-foreground">Ringkasan section</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Jumlah soal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Moji · Goi</TableCell>
                    <TableCell className="text-right">{preview.mojiCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Bunpou · Dokkai</TableCell>
                    <TableCell className="text-right">{preview.bunpouCount}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Choukai</TableCell>
                    <TableCell className="text-right">{preview.chokaiCount}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          ) : null}

          {preview.ok ? (
            <p className="text-sm text-muted-foreground">
              Setelah impor, tinjau paket di{' '}
              <Link
                href={ADMIN_ROUTES.tryoutPaket}
                className="font-medium text-brand-red hover:underline"
              >
                daftar Paket Soal
              </Link>{' '}
              lalu set READY jika sudah lengkap 3 section.
            </p>
          ) : null}
        </div>
      ) : null}
    </AdminPageShell>
  );
}
