'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createLessonAction,
  updateLessonAction,
} from '@/features/admin-cms/actions/cms-lesson-actions';
import { slugifyTitle } from '@/features/admin-cms/lib/validations';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type LessonFormValues = {
  title: string;
  slug: string;
  order: number;
  content: string;
  videoUrl: string;
};

type AdminLessonFormProps = {
  courseId: string;
  moduleId: string;
  moduleTitle: string;
  mode: 'create' | 'edit';
  lessonId?: string;
  initial?: LessonFormValues;
};

export function AdminLessonForm({
  courseId,
  moduleId,
  moduleTitle,
  mode,
  lessonId,
  initial,
}: AdminLessonFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [values, setValues] = useState<LessonFormValues>(
    initial ?? { title: '', slug: '', order: 1, content: '', videoUrl: '' },
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('courseId', courseId);
    formData.set('moduleId', moduleId);
    formData.set('title', values.title);
    formData.set('slug', values.slug);
    formData.set('order', String(values.order));
    formData.set('content', values.content);
    formData.set('videoUrl', values.videoUrl);

    startTransition(async () => {
      const result =
        mode === 'edit' && lessonId
          ? await updateLessonAction(lessonId, formData)
          : await createLessonAction(formData);

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        return;
      }
      if (!result.ok && result.message) {
        setError(result.message);
        return;
      }
      router.refresh();
    });
  };

  return (
    <AdminPageShell
      label={moduleTitle}
      title={mode === 'create' ? 'Pelajaran Baru' : 'Edit Pelajaran'}
      subtitle="Buat pelajaran baru. Setelah disimpan, kamu bisa menambah flashcard dan kuis di halaman edit."
      backHref={ADMIN_ROUTES.kursusLessons(courseId, moduleId)}
    >
      <Card className="max-w-3xl border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold">Informasi Pelajaran</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="title">
                Judul Pelajaran <span className="text-brand-red">*</span>
              </Label>
              <Input
                id="title"
                value={values.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setValues((prev) => ({
                    ...prev,
                    title,
                    slug: mode === 'create' && !prev.slug ? slugifyTitle(title) : prev.slug,
                  }));
                }}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={values.slug}
                  onChange={(event) => setValues((prev) => ({ ...prev, slug: event.target.value }))}
                  required
                />
                {fieldErrors.slug?.[0] ? (
                  <p className="text-xs text-destructive">{fieldErrors.slug[0]}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Urutan</Label>
                <Input
                  id="order"
                  type="number"
                  min={1}
                  value={values.order}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, order: Number(event.target.value) }))
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoUrl">URL Video (opsional)</Label>
              <Input
                id="videoUrl"
                type="url"
                value={values.videoUrl}
                onChange={(event) => setValues((prev) => ({ ...prev, videoUrl: event.target.value }))}
                placeholder="https://youtube.com/..."
              />
              {fieldErrors.videoUrl?.[0] ? (
                <p className="text-xs text-destructive">{fieldErrors.videoUrl[0]}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Catatan / intro (opsional)</Label>
              <Textarea
                id="content"
                value={values.content}
                onChange={(event) => setValues((prev) => ({ ...prev, content: event.target.value }))}
                rows={5}
                placeholder="Penjelasan singkat sebelum siswa mulai belajar..."
              />
            </div>

            <div className="flex gap-2 border-t border-border pt-6">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Menyimpan...' : mode === 'create' ? 'Buat Pelajaran' : 'Simpan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ADMIN_ROUTES.kursusLessons(courseId, moduleId))}
              >
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
