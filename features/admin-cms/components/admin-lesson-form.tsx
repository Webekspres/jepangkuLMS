'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LessonType } from '@prisma/client';
import { AdminAdvancedSlugField } from '@/features/admin-cms/components/admin-advanced-slug-field';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
    createLessonAction,
    updateLessonAction,
} from '@/features/admin-cms/actions/cms-lesson-actions';
import { getLessonTypeDefinition } from '@/features/learning/lib/lesson-type-registry';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkdownToolbarTextarea } from '@/features/admin-cms/components/markdown-toolbar-textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type LessonFormValues = {
    title: string;
    slug: string;
    lessonType: LessonType | '';
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
        initial ?? { title: '', slug: '', lessonType: '', content: '', videoUrl: '' },
    );
    const lessonTypeDef = getLessonTypeDefinition(values.lessonType || null);
    const showVideoField = lessonTypeDef.allowsVideoField;
    const showContentField = lessonTypeDef.allowsContentField;

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setFieldErrors({});

        const formData = new FormData();
        formData.set('courseId', courseId);
        formData.set('moduleId', moduleId);
        formData.set('title', values.title);
        formData.set('lessonType', values.lessonType);
        if (mode === 'edit') {
            formData.set('slug', values.slug);
        }
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
            subtitle="Buat pelajaran baru. Urutan diatur via drag & drop di halaman pelajaran."
            backHref={ADMIN_ROUTES.kursusLessons(courseId, moduleId)}
        >
            <Card className="w-full border-border">
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
                                onChange={(event) => setValues((prev) => ({ ...prev, title: event.target.value }))}
                                placeholder="Pengenalan aksara Jepang"
                                required
                            />
                            {fieldErrors.title?.[0] ? (
                                <p className="text-xs text-destructive">{fieldErrors.title[0]}</p>
                            ) : null}
                            {mode === 'create' ? (
                                <p className="text-xs text-muted-foreground">
                                    Slug pelajaran dibuat otomatis dari judul saat disimpan.
                                </p>
                            ) : null}
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
                            <Label htmlFor="lessonType">
                                Tipe Pelajaran <span className="text-brand-red">*</span>
                            </Label>
                            <Select
                                value={values.lessonType}
                                onValueChange={(value) => {
                                    const nextLessonType = value as LessonType;
                                    const nextTypeDef = getLessonTypeDefinition(nextLessonType);
                                    setValues((prev) => ({
                                        ...prev,
                                        lessonType: nextLessonType,
                                        videoUrl: nextTypeDef.allowsVideoField ? prev.videoUrl : '',
                                        content: nextTypeDef.allowsContentField ? prev.content : '',
                                    }));
                                }}
                            >
                                <SelectTrigger id="lessonType">
                                    <SelectValue placeholder="Pilih tipe pelajaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIDEO">Video</SelectItem>
                                    <SelectItem value="FLASHCARD">Flashcard</SelectItem>
                                    <SelectItem value="QUIZ">Quiz</SelectItem>
                                    <SelectItem value="TEXT">Text / Reading</SelectItem>
                                </SelectContent>
                            </Select>
                            {fieldErrors.lessonType?.[0] ? (
                                <p className="text-xs text-destructive">{fieldErrors.lessonType[0]}</p>
                            ) : null}
                            <p className="text-xs text-muted-foreground">
                                Tipe ini menentukan editor utama yang akan dipakai siswa dan admin.
                            </p>
                        </div>

                        {showVideoField ? (
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
                        ) : null}

                        {showContentField ? (
                        <div className="space-y-2">
                            <Label htmlFor="content">
                                {lessonTypeDef.contentFieldLabel} (opsional)
                            </Label>
                            <MarkdownToolbarTextarea
                                id="content"
                                value={values.content}
                                onChange={(next) => setValues((prev) => ({ ...prev, content: next }))}
                                rows={8}
                                placeholder="Penjelasan singkat sebelum siswa mulai belajar..."
                            />
                        </div>
                        ) : null}

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
