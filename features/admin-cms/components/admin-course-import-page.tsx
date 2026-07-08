'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, FileDown, FileUp, Loader2, Upload } from 'lucide-react';
import {
    importCourseWorkbookAction,
    previewCourseImportAction,
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
import { buildCourseImportReportText } from '@/features/admin-cms/lib/import-framework/build-course-import-report-text';
import type { CourseImportPreview } from '@/features/admin-cms/lib/course-import-types';

function downloadImportReport(preview: CourseImportPreview, filename: string) {
    const text = buildCourseImportReportText(preview);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

async function fileToBase64(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return btoa(binary);
}

export function AdminCourseImportPage() {
    const router = useRouter();
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
            setMessage({ type: 'error', text: 'Format harus .xlsx (template resmi atau workbook sensei N4/N5).' });
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
            const result = await previewCourseImportAction(base64);
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
            const result = await importCourseWorkbookAction(base64);
            if (result.ok) {
                // Redirect to the modul page if single course, otherwise kursus list.
                const imported = result.imported ?? [];
                if (imported.length === 1) {
                    router.push(ADMIN_ROUTES.kursusModules(imported[0]!.courseId));
                } else {
                    router.push(ADMIN_ROUTES.kursus);
                }
            } else {
                setMessage({ type: 'error', text: result.message });
                setPreviewResult({
                    ok: false,
                    preview: {
                        ...result.preview,
                        ok: false,
                        errors: result.errors?.length
                            ? [...result.preview.errors, ...result.errors.filter(
                                  (error) =>
                                      !result.preview.errors.some(
                                          (existing) =>
                                              existing.code === error.code &&
                                              existing.message === error.message,
                                      ),
                              )]
                            : result.preview.errors,
                    },
                });
            }
        });
    };

    const preview = previewResult?.preview;
    const canImport = Boolean(preview?.ok && file);
    const hasReport =
        Boolean(preview) &&
        (preview!.errors.length > 0 ||
            preview!.warnings.length > 0 ||
            (preview!.structuredWarnings?.length ?? 0) > 0);

    return (
        <AdminPageShell
            label="Konten"
            title="Impor Kursus"
            subtitle="Unggah template resmi JepangKu atau workbook sensei N4/N5 untuk sinkronisasi materi kursus."
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
                        <p className="text-sm font-medium">Seret file .xlsx atau klik untuk memilih</p>
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
                        <li>
                            Unduh{' '}
                            <a
                                href="/api/admin/kursus/template"
                                className="font-medium text-brand-red hover:underline"
                            >
                                template resmi v1
                            </a>{' '}
                            untuk kursus baru, atau gunakan workbook sensei <strong>N4.xlsx</strong> / <strong>N5.xlsx</strong>.
                        </li>
                        <li>Sheet referensi pada workbook sensei (Percakapan/Kurikulum/Standar/Link) dilewati otomatis.</li>
                        <li>Kolom pilihan (publikasi, tipe pelajaran, level, track) memakai dropdown di Excel.</li>
                        <li>Slug URL dibuat otomatis dari judul saat impor — tidak perlu diisi di template.</li>
                        <li>Untuk kanji, isi kolom GIF Cara Menulis Kanji (URL animasi goresan) di tab Flashcard.</li>
                        <li>Lanjut impor hanya setelah pratinjau valid.</li>
                    </ol>
                    <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                        <a href="/api/admin/kursus/template">
                            <Download className="size-4" />
                            Unduh template v1
                        </a>
                    </Button>
                </Card>
            </div>

            {preview ? (
                <div className="mt-8 space-y-6">
                    <div className="flex flex-wrap gap-3">
                        {preview.template ? (
                            <Badge variant="outline">
                                Template: {preview.template.key} {preview.template.version}
                            </Badge>
                        ) : null}
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
                        {hasReport ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1.5"
                                onClick={() =>
                                    downloadImportReport(
                                        preview,
                                        `laporan-impor-kursus-${new Date().toISOString().slice(0, 10)}.txt`,
                                    )
                                }
                            >
                                <FileDown className="size-3.5" />
                                Unduh laporan
                            </Button>
                        ) : null}
                    </div>

                    {preview.errors.length > 0 ? (
                        <Card className="border-destructive/30 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-destructive">Perlu diperbaiki</h3>
                            <ul className="max-h-48 space-y-2 overflow-y-auto text-sm text-destructive">
                                {preview.errors.map((error, index) => (
                                    <li
                                        key={`${error.sheet ?? 'sheet'}-${error.row}-${error.code ?? index}`}
                                        className="flex flex-wrap items-start gap-2"
                                    >
                                        {error.code ? (
                                            <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                                                {error.code}
                                            </Badge>
                                        ) : null}
                                        <span>{error.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ) : null}

                    {(preview.structuredWarnings?.length ?? 0) > 0 ? (
                        <Card className="border-amber-200 bg-amber-50/50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-amber-900">Perhatian</h3>
                            <ul className="space-y-2 text-sm text-amber-900">
                                {preview.structuredWarnings!.map((warning, index) => (
                                    <li
                                        key={`${warning.sheet ?? 'sheet'}-${warning.row}-${warning.code ?? index}`}
                                        className="flex flex-wrap items-start gap-2"
                                    >
                                        {warning.code ? (
                                            <Badge
                                                variant="outline"
                                                className="shrink-0 border-amber-300 font-mono text-[10px] text-amber-900"
                                            >
                                                {warning.code}
                                            </Badge>
                                        ) : null}
                                        <span>{warning.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    ) : preview.warnings.length > 0 ? (
                        <Card className="border-amber-200 bg-amber-50/50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-amber-900">Perhatian</h3>
                            <ul className="space-y-1 text-sm text-amber-900">
                                {preview.warnings.map((warning) => (
                                    <li key={warning}>{warning}</li>
                                ))}
                            </ul>
                        </Card>
                    ) : null}

                    {preview.modulePreview && preview.modulePreview.length > 0 ? (
                        <Card className="overflow-hidden border-border">
                            <div className="border-b border-border px-4 py-3">
                                <h3 className="text-sm font-semibold text-foreground">Struktur modul & pelajaran</h3>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Modul</TableHead>
                                        <TableHead>Pelajaran</TableHead>
                                        <TableHead>Tipe</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {preview.modulePreview.flatMap((module) =>
                                        module.lessons.length > 0
                                            ? module.lessons.map((lesson, lessonIndex) => (
                                                  <TableRow
                                                      key={`${module.moduleExternalId}-${lesson.lessonExternalId}`}
                                                  >
                                                      {lessonIndex === 0 ? (
                                                          <TableCell
                                                              rowSpan={module.lessons.length}
                                                              className="align-top font-medium"
                                                          >
                                                              {module.moduleTitle}
                                                          </TableCell>
                                                      ) : null}
                                                      <TableCell>{lesson.title}</TableCell>
                                                      <TableCell>
                                                          <Badge variant="secondary">{lesson.lessonType}</Badge>
                                                      </TableCell>
                                                  </TableRow>
                                              ))
                                            : [
                                                  <TableRow key={module.moduleExternalId}>
                                                      <TableCell className="font-medium">{module.moduleTitle}</TableCell>
                                                      <TableCell colSpan={2} className="text-muted-foreground">
                                                          (belum ada pelajaran)
                                                      </TableCell>
                                                  </TableRow>,
                                              ],
                                    )}
                                </TableBody>
                            </Table>
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
