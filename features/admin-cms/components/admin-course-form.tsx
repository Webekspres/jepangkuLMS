'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAdvancedSlugField } from '@/features/admin-cms/components/admin-advanced-slug-field';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createCourseAction,
  updateCourseAction,
} from '@/features/admin-cms/actions/cms-course-actions';
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
import type { CourseCategoryType } from '@prisma/client';
import {
  COURSE_CATEGORY_TYPE_OPTIONS,
} from '@/lib/lms/course-category';

type CourseFormValues = {
  title: string;
  slug: string;
  description: string;
  outcomes: string[];
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  category: CourseCategoryType;
  priceIdr: number;
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
      outcomes: [],
      level: 'N5',
      category: 'KURSUS_UTAMA',
      priceIdr: 0,
      isPublished: false,
    },
  );
  // Raw textarea buffer (one outcome per line) — split into an array only on submit
  // so admins can type freely, including transient blank lines.
  const [outcomesText, setOutcomesText] = useState<string>(
    (initial?.outcomes ?? []).join('\n'),
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('title', values.title);
    if (mode === 'edit') {
      formData.set('slug', values.slug);
    }
    formData.set('description', values.description);
    formData.set('outcomes', outcomesText);
    formData.set('level', values.level);
    formData.set('category', values.category);
    formData.set('priceIdr', String(values.priceIdr));
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
                Nama Kursus <span className="text-brand-red">*</span>
              </Label>
              <Input
                id="title"
                value={values.title}
                onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Masukkan nama kursus"
                required
              />
              {/* {fieldErrors.title?.[0] ? (
                <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
              ) : null}
              {mode === 'create' ? (
                <p className="text-xs text-muted-foreground">
                  URL kursus dibuat otomatis dari judul saat disimpan.
                </p>
              ) : null} */}
            </div>

            {mode === 'edit' ? (
              <AdminAdvancedSlugField
                id="slug"
                slug={values.slug}
                onSlugChange={(slug) => setValues((prev) => ({ ...prev, slug }))}
                error={fieldErrors.slug?.[0]}
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  Kategori Kursus <span className="text-brand-red">*</span>
                </Label>
                <Select
                  value={values.category}
                  onValueChange={(value) =>
                    setValues((prev) => ({
                      ...prev,
                      category: value as CourseCategoryType,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORY_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.category?.[0] ? (
                  <p className="text-xs text-destructive">{fieldErrors.category[0]}</p>
                ) : null}
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="priceIdr">Harga (Rp)</Label>
                <Input
                  id="priceIdr"
                  type="number"
                  min={0}
                  step={1000}
                  value={values.priceIdr}
                  onChange={(event) =>
                    setValues((prev) => ({
                      ...prev,
                      priceIdr: Number.parseInt(event.target.value, 10) || 0,
                    }))
                  }
                  placeholder="0 = gratis"
                />
                {fieldErrors.priceIdr?.[0] ? (
                  <p className="text-xs text-destructive">{fieldErrors.priceIdr[0]}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Isi 0 untuk kursus gratis.</p>
                )}
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

            <div className="space-y-2">
              <Label htmlFor="outcomes">Yang akan kamu pelajari</Label>
              <Textarea
                id="outcomes"
                value={outcomesText}
                onChange={(event) => setOutcomesText(event.target.value)}
                rows={6}
                placeholder={'Satu poin per baris, mis.\nMembaca dan menulis Hiragana & Katakana\n80 Kanji dasar N5\nPola tata bahasa N5'}
              />
              {fieldErrors.outcomes?.[0] ? (
                <p className="text-xs text-destructive">{fieldErrors.outcomes[0]}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Tulis satu poin pembelajaran per baris. Ditampilkan di halaman detail kursus
                  (maks. 20 poin).
                </p>
              )}
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
