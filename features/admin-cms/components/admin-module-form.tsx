'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createModuleAction,
  updateModuleAction,
} from '@/features/admin-cms/actions/cms-module-actions';
import { slugifyTitle } from '@/features/admin-cms/lib/validations';
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
  order: number;
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
    initial ?? { title: '', slug: '', description: '', order: 1 },
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.set('courseId', courseId);
    formData.set('title', values.title);
    formData.set('slug', values.slug);
    formData.set('description', values.description);
    formData.set('order', String(values.order));

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
      subtitle="Modul adalah bab/kontainer utama di dalam kursus."
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
                onChange={(event) => {
                  const title = event.target.value;
                  setValues((prev) => ({
                    ...prev,
                    title,
                    slug: mode === 'create' && !prev.slug ? slugifyTitle(title) : prev.slug,
                  }));
                }}
                placeholder="Modul 1 — Hiragana & Katakana"
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
                {fieldErrors.order?.[0] ? (
                  <p className="text-xs text-destructive">{fieldErrors.order[0]}</p>
                ) : null}
              </div>
            </div>

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
