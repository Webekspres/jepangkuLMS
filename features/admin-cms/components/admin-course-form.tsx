'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createCourseAction,
  updateCourseAction,
} from '@/features/admin-cms/actions/cms-course-actions';
import { slugifyTitle } from '@/features/admin-cms/lib/validations';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

type CourseFormValues = {
  title: string;
  slug: string;
  description: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  isPublished: boolean;
};

type AdminCourseFormProps = {
  mode: 'create' | 'edit';
  courseId?: string;
  initial?: CourseFormValues;
};

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

export function AdminCourseForm({ mode, courseId, initial }: AdminCourseFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [values, setValues] = useState<CourseFormValues>(
    initial ?? {
      title: '',
      slug: '',
      description: '',
      level: 'N5',
      isPublished: false,
    },
  );

  const handleTitleChange = (title: string) => {
    setValues((prev) => ({
      ...prev,
      title,
      slug: mode === 'create' && !prev.slug ? slugifyTitle(title) : prev.slug,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('title', values.title);
    formData.set('slug', values.slug);
    formData.set('description', values.description);
    formData.set('level', values.level);
    if (values.isPublished) formData.set('isPublished', 'on');

    startTransition(async () => {
      const result =
        mode === 'edit' && courseId
          ? await updateCourseAction(courseId, formData)
          : await createCourseAction(formData);

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
      label="Kursus"
      title={mode === 'create' ? 'Buat Kursus Baru' : 'Edit Kursus'}
      subtitle="Isi metadata kursus. Modul dan pelajaran ditambahkan setelah kursus dibuat."
      backHref={ADMIN_ROUTES.kursus}
    >
      <Card className="max-w-3xl border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold">Informasi Kursus</CardTitle>
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
                Judul Kursus <span className="text-brand-red">*</span>
              </Label>
              <Input
                id="title"
                value={values.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="JLPT N5 — Kursus Lengkap"
                required
              />
              {fieldErrors.title?.[0] ? (
                <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug URL <span className="text-brand-red">*</span>
              </Label>
              <Input
                id="slug"
                value={values.slug}
                onChange={(event) => setValues((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="jlpt-n5-kursus-lengkap"
                required
              />
              {fieldErrors.slug?.[0] ? (
                <p className="text-xs text-destructive">{fieldErrors.slug[0]}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Level JLPT</Label>
                <Select
                  value={values.level}
                  onValueChange={(value) =>
                    setValues((prev) => ({ ...prev, level: value as CourseFormValues['level'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={values.isPublished}
                    onCheckedChange={(checked) =>
                      setValues((prev) => ({ ...prev, isPublished: checked === true }))
                    }
                  />
                  Publikasikan kursus
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={5}
                placeholder="Ringkasan singkat kursus untuk katalog..."
              />
            </div>

            <div className="flex gap-2 border-t border-border pt-6">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Menyimpan...' : mode === 'create' ? 'Buat Kursus' : 'Simpan Perubahan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(ADMIN_ROUTES.kursus)}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
