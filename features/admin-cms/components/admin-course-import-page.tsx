'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Download, FileUp, Loader2, Upload } from 'lucide-react';
import {
  importCoursesCsvAction,
  previewCourseCsvAction,
  type CmsImportPreviewResult,
} from '@/features/admin-cms/actions/cms-import-actions';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import {
  COURSE_CSV_COLUMNS,
  COURSE_CSV_TEMPLATE,
} from '@/features/admin-cms/lib/import-course-csv';
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
import { Textarea } from '@/components/ui/textarea';

function downloadTemplate() {
  const blob = new Blob([COURSE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'course-import-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminCourseImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState('');
  const [previewResult, setPreviewResult] = useState<CmsImportPreviewResult | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result ?? ''));
      setPreviewResult(null);
      setMessage(null);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePreview = () => {
    setMessage(null);
    startPreviewTransition(async () => {
      const result = await previewCourseCsvAction(csvText);
      setPreviewResult(result);
      if (!result.ok) {
        setMessage({
          type: 'error',
          text: 'CSV belum valid. Periksa error di bawah sebelum mengimpor.',
        });
      }
    });
  };

  const handleImport = () => {
    setMessage(null);
    startImportTransition(async () => {
      const result = await importCoursesCsvAction(csvText);
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
  const canImport = Boolean(preview?.ok && csvText.trim());

  return (
    <AdminPageShell
      label="Konten"
      title="Import Kursus CSV"
      subtitle="Unggah satu file CSV untuk membuat atau memperbarui beberapa kursus sekaligus — beserta modul dan pelajarannya."
      backHref={ADMIN_ROUTES.kursus}
      action={
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          <Download className="size-4" />
          Unduh Template
        </Button>
      }
    >
      {message ? (
        <p
          className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-destructive/30 bg-destructive/5 text-destructive'
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4" />
              Pilih File CSV
            </Button>
            <p className="text-xs text-muted-foreground">Maks. 5 MB · {preview?.rowCount ?? 0} baris terbaca</p>
          </div>

          <Textarea
            value={csvText}
            onChange={(event) => {
              setCsvText(event.target.value);
              setPreviewResult(null);
              setMessage(null);
            }}
            placeholder="Tempel isi CSV di sini, atau unggah file..."
            className="min-h-[280px] font-mono text-xs"
            spellCheck={false}
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={!csvText.trim() || isPreviewPending || isImportPending}
            >
              {isPreviewPending ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
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
          <h2 className="mb-3 text-sm font-semibold text-foreground">Format CSV</h2>
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            Gunakan <span className="font-mono">row_type</span> untuk jenis baris:{' '}
            <span className="font-mono">lesson</span> (struktur),{' '}
            <span className="font-mono">kosakata</span>, <span className="font-mono">kanji</span>,{' '}
            <span className="font-mono">tatabahasa</span>, atau <span className="font-mono">quiz</span>.
            Baris materi/kuis cukup isi <span className="font-mono">lesson_slug</span> + kolom terkait.
            Impor bersifat <strong>upsert</strong> berdasarkan slug.
          </p>
          <p className="mb-3 text-xs text-muted-foreground">
            Video pelajaran: kolom <span className="font-mono">lesson_video_url</span> pada baris{' '}
            <span className="font-mono">lesson</span>.
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {COURSE_CSV_COLUMNS.map((column) => (
              <li key={column} className="font-mono">
                {column}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Nilai <span className="font-mono">course_published</span>:{' '}
            <span className="font-mono">true</span>, <span className="font-mono">1</span>, atau{' '}
            <span className="font-mono">ya</span> untuk mempublikasikan.
          </p>
        </Card>
      </div>

      {preview ? (
        <div className="mt-8 space-y-6">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">{preview.rowCount} baris</Badge>
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
              <h3 className="mb-2 text-sm font-semibold text-destructive">Error validasi</h3>
              <ul className="space-y-1 text-sm text-destructive">
                {preview.errors.map((error) => (
                  <li key={`${error.row}-${error.message}`}>
                    {error.row > 0 ? `Baris ${error.row}: ` : ''}
                    {error.message}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {preview.warnings.length > 0 ? (
            <Card className="border-amber-200 bg-amber-50/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-amber-900">Peringatan</h3>
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
                    <TableHead>Slug</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Modul</TableHead>
                    <TableHead className="text-right">Pelajaran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPreviewCourses.map((course) => (
                    <TableRow key={course.slug}>
                      <TableCell className="font-mono text-xs">{course.slug}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>{course.level}</TableCell>
                      <TableCell>
                        {course.isPublished ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">Publik</Badge>
                        ) : (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                      </TableCell>
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
              Flashcard dan kuis dari CSV akan langsung tersedia di workspace pelajaran. Anda masih bisa
              menambah atau mengeditnya manual di{' '}
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
