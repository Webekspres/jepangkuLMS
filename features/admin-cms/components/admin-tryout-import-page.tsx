'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Download, FileUp, Loader2, Upload } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type WorkbookPreview = {
    ok: boolean;
    session: {
        title: string;
        code: string;
        phaseLabel: string;
        level: string;
    } | null;
    questionPreview: {
        sectionCounts: Record<string, number>;
        errors: { row: number; message: string }[];
    };
    warnings: string[];
};

export function AdminTryoutImportPage() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [pending, setPending] = useState(false);
    const [preview, setPreview] = useState<WorkbookPreview | null>(null);

    async function run(fileToUpload: File, dryRun: boolean) {
        setPending(true);
        if (!dryRun) setPreview(null);

        const formData = new FormData();
        formData.set('file', fileToUpload);

        try {
            const url = `/api/admin/tryout/import${dryRun ? '?dryRun=1' : ''}`;
            const response = await fetch(url, { method: 'POST', body: formData, credentials: 'same-origin' });
            const json = await response.json();

            if (dryRun) {
                setPreview(json.preview as WorkbookPreview);
                if (json.ok) toast.success('Formulir valid — siap diimpor.');
                else toast.error('Formulir perlu diperbaiki.');
                return;
            }

            if (json.ok) {
                toast.success(json.message);
                if (json.sessionId) {
                    window.location.href = ADMIN_ROUTES.tryoutSessionQuestions(json.sessionId);
                }
            } else {
                toast.error(json.message);
            }
        } catch {
            toast.error('Gagal mengunggah file.');
        } finally {
            setPending(false);
        }
    }

    function handleFile(next: File | null) {
        if (!next) return;
        if (!next.name.toLowerCase().endsWith('.xlsx')) {
            toast.error('Format harus .xlsx');
            return;
        }
        setFile(next);
        setPreview(null);
        void run(next, true);
    }

    return (
        <AdminPageShell
            label="Program"
            title="Impor Tryout JLPT"
            subtitle="Satu formulir Excel = info sesi + soal Kosakata & Kanji + Tata Bahasa & Membaca."
            backHref={ADMIN_ROUTES.tryoutSessions}
            action={
                <Button type="button" variant="outline" asChild>
                    <a href="/api/admin/tryout/template">
                        <Download className="size-4" />
                        Unduh Formulir Excel
                    </a>
                </Button>
            }
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                <Card className="border-border p-6">
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".xlsx"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                    />

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
                            handleFile(e.dataTransfer.files?.[0] ?? null);
                        }}
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
                            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                            pending && 'pointer-events-none opacity-60',
                        )}
                    >
                        {pending ? <Loader2 className="size-8 animate-spin text-primary" /> : <FileUp className="size-8 text-muted-foreground" />}
                        <p className="text-sm font-medium">{file?.name ?? 'Seret formulir .xlsx atau klik untuk memilih'}</p>
                    </div>

                    <Button
                        type="button"
                        className="mt-4 w-full"
                        disabled={!file || pending || !preview?.ok}
                        onClick={() => file && void run(file, false)}
                    >
                        <Upload className="size-4" />
                        Impor Sesi & Soal
                    </Button>
                </Card>

                <Card className="h-fit border-border p-5">
                    <h2 className="mb-2 text-sm font-semibold">Isi formulir</h2>
                    <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                        <li>Tab Info Sesi — satu baris</li>
                        <li>Tab Kosakata & Kanji</li>
                        <li>Tab Tata Bahasa & Membaca</li>
                    </ol>
                    <p className="mt-3 text-xs text-muted-foreground">
                        Bagian mendengarkan (Chokai) tidak termasuk — kelola terpisah di CMS.
                    </p>
                </Card>
            </div>

            {preview ? (
                <div className="mt-8 space-y-4">
                    {preview.session ? (
                        <Card className="border-border p-4">
                            <p className="text-sm font-medium">{preview.session.title}</p>
                            <p className="text-xs text-muted-foreground">
                                Kode: {preview.session.code} · {preview.session.level} · {preview.session.phaseLabel}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="secondary">
                                    Kosakata & Kanji: {preview.questionPreview.sectionCounts.MOJI_GOI ?? 0}
                                </Badge>
                                <Badge variant="secondary">
                                    Tata Bahasa: {preview.questionPreview.sectionCounts.BUNPOU_DOKKAI ?? 0}
                                </Badge>
                                {preview.ok ? (
                                    <Badge className="bg-emerald-600 hover:bg-emerald-600">Siap diimpor</Badge>
                                ) : (
                                    <Badge variant="destructive">Ada error</Badge>
                                )}
                            </div>
                        </Card>
                    ) : null}

                    {preview.warnings.map((w) => (
                        <p key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                            {w}
                        </p>
                    ))}

                    {preview.questionPreview.errors.length > 0 ? (
                        <Card className="border-destructive/30 p-4">
                            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-destructive">
                                {preview.questionPreview.errors.map((err) => (
                                    <li key={`${err.row}-${err.message}`}>{err.message}</li>
                                ))}
                            </ul>
                        </Card>
                    ) : null}
                </div>
            ) : null}

            <p className="mt-6 text-sm text-muted-foreground">
                Untuk menambah soal ke sesi yang sudah ada, buka{' '}
                <Link href={ADMIN_ROUTES.tryoutSessions} className="font-medium text-brand-red hover:underline">
                    detail sesi tryout
                </Link>
                .
            </p>
        </AdminPageShell>
    );
}
