'use client';

import { useRef, useState } from 'react';
import { Download, FileUp, Loader2, Upload } from 'lucide-react';
import type { LevelJLPT } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ChokaiPreview = {
    ok: boolean;
    rowCount: number;
    rows: {
        rowNumber: number;
        folder: string;
        answerOptionKind: string;
        jawaban: string;
        audioRange: string;
        optionSummary: string;
        ok: boolean;
        message?: string;
    }[];
    errors: { row: number; message: string }[];
};

type AdminTryoutChokaiImportPanelProps = {
    sessionId: string;
    level: LevelJLPT;
    onImported: () => void;
};

export function AdminTryoutChokaiImportPanel({
    sessionId,
    level,
    onImported,
}: AdminTryoutChokaiImportPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [pending, setPending] = useState(false);
    const [preview, setPreview] = useState<ChokaiPreview | null>(null);
    const [importResult, setImportResult] = useState<{ ok: boolean; message: string } | null>(null);

    async function runDryRun(next: File) {
        setPending(true);
        setPreview(null);
        setImportResult(null);
        setFile(next);

        const formData = new FormData();
        formData.set('file', next);
        formData.set('sessionId', sessionId);
        formData.set('level', level);

        try {
            const response = await fetch('/api/admin/tryout/import-chokai?dryRun=1', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            });
            const json = (await response.json()) as { ok: boolean; preview: ChokaiPreview; message: string };
            setPreview(json.preview);
            if (json.ok) toast.success('Paket valid — siap impor.');
            else toast.error('Perbaiki paket ZIP.');
        } catch {
            toast.error('Gagal memvalidasi ZIP.');
        } finally {
            setPending(false);
        }
    }

    async function commitImport() {
        if (!file) return;
        setPending(true);
        const formData = new FormData();
        formData.set('file', file);
        formData.set('sessionId', sessionId);
        formData.set('level', level);

        try {
            const response = await fetch('/api/admin/tryout/import-chokai', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            });
            const json = (await response.json()) as { ok: boolean; message: string };
            setImportResult(json);
            if (json.ok) {
                toast.success(json.message);
                onImported();
            } else {
                toast.error(json.message);
            }
        } catch {
            toast.error('Impor gagal.');
        } finally {
            setPending(false);
        }
    }

    function handleFiles(files: FileList | null) {
        const next = files?.[0];
        if (!next) return;
        if (!next.name.toLowerCase().endsWith('.zip')) {
            toast.error('Format harus .zip');
            return;
        }
        void runDryRun(next);
    }

    return (
        <Card className="border-emerald-500/20">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Impor Chokai (ZIP)</CardTitle>
        <p className="text-xs text-muted-foreground">
          Mengganti semua soal CHOKAI level {level}. Paket berisi chokai.xlsx + folder
          assets/ (lihat PANDUAN-IMPOR-CHOKAI.txt di template).
        </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button type="button" variant="outline" size="sm" className="w-full" asChild>
                    <a href="/api/admin/tryout/chokai-template">
                        <Download className="size-4" />
                        Unduh Template ZIP
                    </a>
                </Button>

                <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && !pending && inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (!pending) handleFiles(e.dataTransfer.files);
                    }}
                    onClick={() => !pending && inputRef.current?.click()}
                    className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
                        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                        pending && 'pointer-events-none opacity-60',
                    )}
                >
                    {pending ? (
                        <Loader2 className="size-8 animate-spin text-primary" />
                    ) : (
                        <FileUp className="size-8 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium">{pending ? 'Memproses…' : 'Seret .zip atau klik'}</p>
                    {file ? <p className="text-xs font-medium text-primary">{file.name}</p> : null}
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                />

                {preview ? (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2 text-xs">
                        {preview.rows.map((row) => (
                            <p
                                key={row.rowNumber}
                                className={cn(row.ok ? 'text-foreground' : 'text-destructive')}
                            >
                                {row.ok ? '✓' : '✗'} #{row.rowNumber} {row.folder} · {row.answerOptionKind} ·{' '}
                                {row.optionSummary} · {row.jawaban}
                                {row.message ? ` — ${row.message}` : ''}
                            </p>
                        ))}
                        {preview.errors.map((e) => (
                            <p key={`${e.row}-${e.message}`} className="text-destructive">
                                {e.message}
                            </p>
                        ))}
                    </div>
                ) : null}

                {importResult ? (
                    <p
                        className={cn(
                            'rounded-lg border px-3 py-2 text-sm',
                            importResult.ok
                                ? 'border-emerald-500/30 bg-emerald-500/5'
                                : 'border-destructive/30 bg-destructive/5 text-destructive',
                        )}
                    >
                        {importResult.message}
                    </p>
                ) : null}

                <Button
                    type="button"
                    className="w-full"
                    disabled={pending || !preview?.ok}
                    onClick={() => void commitImport()}
                >
                    <Upload className="size-4" />
                    Impor {preview?.rowCount ?? 0} Soal Chokai
                </Button>
            </CardContent>
        </Card>
    );
}
