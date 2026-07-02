'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { FileUp, Loader2, Upload } from 'lucide-react';
import {
    importSenseiCourseAction,
    previewSenseiCourseAction,
    type CmsImportPreviewResult,
} from '@/features/admin-cms/actions/cms-import-actions';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
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

async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
}

export function AdminCourseImportPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [previewResult, setPreviewResult] = useState<CmsImportPreviewResult | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [isPreviewPending, startPreviewTransition] = useTransition();
    const [isImportPending, startImportTransition] = useTransition();

    const previewCourses = previewResult?.preview.courses ?? [];
    const {
        paginatedItems: paginatedPreviewCourses,
        page: previewPage,
        pageSize: previewPageSize,
        totalItems: previewTotalItems,
        setPage: setPreviewPage,
        setPageSize: setPreviewPageSize,
    } = useAdminTablePagination(previewCourses, {
        resetKey: previewResult?.preview.rowCount ?? 0,
    });

    const handleFile = (next: File | null) => {
        if (!next) return;
        if (!next.name.toLowerCase().endsWith('.xlsx')) {
            setMessage({ type: 'error', text: 'Format harus .xlsx (workbook sensei N4/N5).' });
            return;
        }
        setFile(next);
        setPreviewResult(null);
        setMessage(null);
    };

    const handlePreview = () => {
        if (!file) return;
        setMessage(null);
        startPreviewTransition(async () => {
            const base64 = await fileToBase64(file);
            const result = await previewSenseiCourseAction(base64);
            setPreviewResult(result);
            if (!result.ok) {
                setMessage({
                    type: 'error',
                    text: 'Workbook belum valid. Periksa pesan di bawah sebelum mengimpor.',
                });
            }
        });
    };

    const handleImport = () => {
        if (!file) return;
        setMessage(null);
        startImportTransition(async () => {
            const base64 = await fileToBase64(file);
            const result = await importSenseiCourseAction(base64);
            if (result.ok) {
                setMessage({ type: 'success', text: result.message });
                setPreviewResult({ ok: true, preview: result.preview });
            } else {
                setMessage({ type: 'error', text: result.message });
                setPreviewResult({ ok: false, preview: result.preview });
            }
        });
    };

    const preview = previewResult?.preview;
    const canImport = Boolean(preview?.ok && file);

    return (
        <AdminPageShell
            label="Konten"
            title="Impor Kursus"
            subtitle="Unggah workbook sensei N4/N5 untuk sinkronisasi materi kursus."
            backHref={ADMIN_ROUTES.kursus}
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
                        accept=".xlsx"
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
                            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30',
                        )}
                    >
                        <Upload className="size-8 text-muted-foreground" />
                        <p className="text-sm font-medium">Seret workbook sensei .xlsx atau klik untuk memilih</p>
                        {file ? <p className="text-xs font-medium text-primary">{file.name}</p> : null}
                        <p className="text-xs text-muted-foreground">Maks. 10 MB</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handlePreview}
                            disabled={!file || isPreviewPending || isImportPending}
                        >
                            {isPreviewPending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                            Pratinjau
                        </Button>
                        <Button type="button" onClick={handleImport} disabled={!canImport || isImportPending || isPreviewPending}>
                            {isImportPending ? <Loader2 className="size-4 animate-spin" /> : null}
                            Impor ke Database
                        </Button>
                    </div>
                </Card>

                <Card className="h-fit border-border p-5">
                    <h2 className="mb-3 text-sm font-semibold text-foreground">Panduan impor</h2>
                    <ol className="list-decimal space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
                        <li>Gunakan file workbook sensei <strong>N4.xlsx</strong> atau <strong>N5.xlsx</strong>.</li>
                        <li>Sheet referensi (Percakapan/Kurikulum/Standar/Link) akan dilewati otomatis.</li>
                        <li>Jika ada kategori baru dari sensei, sistem menampilkan warning saat pratinjau.</li>
                        <li>Lanjut impor hanya setelah pratinjau valid.</li>
                    </ol>
                    <p className="mt-4 text-xs text-muted-foreground">
                        Mode strict-but-flexible: struktur inti dijaga, variasi kolom opsional tetap ditoleransi.
                    </p>
                </Card>
            </div>

            {preview ? (
                <div className="mt-8 space-y-6">
                    <div className="flex flex-wrap gap-3">
                        <Badge variant="secondary">{preview.courseCount} kursus</Badge>
                        <Badge variant="secondary">{preview.moduleCount} modul</Badge>
                        <Badge variant="secondary">{preview.lessonCount} pelajaran</Badge>
                        <Badge variant="secondary">{preview.kosakataCount} kosakata</Badge>
                        <Badge variant="secondary">{preview.kanjiCount} kanji</Badge>
                        <Badge variant="secondary">{preview.tataBahasaCount} tata bahasa</Badge>
                        <Badge variant="secondary">{preview.questionCount} kuis</Badge>
                        {preview.ok ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600">Siap diimpor</Badge>
                        ) : (
                            <Badge variant="destructive">Ada error</Badge>
                        )}
                    </div>

                    {preview.errors.length > 0 ? (
                        <Card className="border-destructive/30 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-destructive">Perlu diperbaiki</h3>
                            <ul className="max-h-48 space-y-1 overflow-y-auto text-sm text-destructive">
                                {preview.errors.map((error) => (
                                    <li key={`${error.row}-${error.message}`}>{error.message}</li>
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

                    {preview.courses.length > 0 ? (
                        <Card className="overflow-hidden border-border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Judul</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead className="text-right">Modul</TableHead>
                                        <TableHead className="text-right">Pelajaran</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedPreviewCourses.map((course) => (
                                        <TableRow key={course.slug}>
                                            <TableCell>{course.title}</TableCell>
                                            <TableCell>{course.level}</TableCell>
                                            <TableCell className="text-right">{course.moduleCount}</TableCell>
                                            <TableCell className="text-right">{course.lessonCount}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <AdminTablePagination
                                page={previewPage}
                                pageSize={previewPageSize}
                                totalItems={previewTotalItems}
                                onPageChange={setPreviewPage}
                                onPageSizeChange={setPreviewPageSize}
                                itemLabel="kursus"
                            />
                        </Card>
                    ) : null}

                    {preview.ok ? (
                        <p className="text-sm text-muted-foreground">
                            Setelah impor, Anda masih bisa mengedit materi di{' '}
                            <Link href={ADMIN_ROUTES.kursus} className="font-medium text-brand-red hover:underline">
                                halaman kursus
                            </Link>
                            .
                        </p>
                    ) : null}
                </div>
            ) : null}
        </AdminPageShell>
    );
}
