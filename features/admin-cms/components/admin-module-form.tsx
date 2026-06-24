'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminAdvancedSlugField } from '@/features/admin-cms/components/admin-advanced-slug-field';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createModuleAction,
  updateModuleAction,
} from '@/features/admin-cms/actions/cms-module-actions';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ModuleFormValues = {
  title: string;
  slug: string;
  description: string;
};

type AdminModuleFormProps = {
  courseId: string;
  courseTitle: string;
  mode: 'create' | 'edit';
  moduleId?: string;
  initial?: ModuleFormValues;
};

export function AdminModuleForm({
  courseId,
  courseTitle,
  mode,
  moduleId,
  initial,
}: AdminModuleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [values, setValues] = useState<ModuleFormValues>(
    initial ?? { title: '', slug: '', description: '' },
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('courseId', courseId);
    formData.set('title', values.title);
    if (mode === 'edit') {
      formData.set('slug', values.slug);
    }
    formData.set('description', values.description);

    startTransition(async () => {
      const result =
        mode === 'edit' && moduleId
          ? await updateModuleAction(moduleId, formData)
          : await createModuleAction(formData);

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
      label={courseTitle}
      title={mode === 'create' ? 'Modul Baru' : 'Edit Modul'}
      subtitle="Modul adalah bab/kontainer utama di dalam kursus. Urutan diatur via drag & drop di halaman modul."
      backHref={ADMIN_ROUTES.kursusModules(courseId)}
    >
      <Card className="max-w-3xl border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold">Informasi Modul</CardTitle>
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
                Judul Modul <span className="text-brand-red">*</span>
              </Label>
              <Input
                id="title"
                value={values.title}
                onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Hiragana & Katakana"
                required
              />
              {/* {fieldErrors.title?.[0] ? (
                <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
              ) : null}
              {mode === 'create' ? (
                <p className="text-xs text-muted-foreground">
                  Slug modul dibuat otomatis dari judul saat disimpan.
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

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi singkat</Label>
              <Textarea
                id="description"
                value={values.description}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                placeholder="6 pelajaran · fondasi aksara Jepang"
              />
            </div>

            <div className="flex gap-2 border-t border-border pt-6">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Menyimpan...' : mode === 'create' ? 'Buat Modul' : 'Simpan'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ADMIN_ROUTES.kursusModules(courseId))}
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
