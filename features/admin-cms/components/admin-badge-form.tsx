'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createBadgeAction,
  updateBadgeAction,
} from '@/features/admin-cms/actions/cms-badge-actions';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { optimizeImageFileForUpload } from '@/lib/media/optimize-image-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { LMS_BADGE_RARITY_OPTIONS } from '@/lib/lms/badge-rarity';
import { z } from 'zod';

type BadgeFormData = {
  id?: string;
  code: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  rarity: string;
  unlockRule: string;
  unlockValue: number | null;
  xpBonus: number;
  requirementText: string | null;
  targetLevel?: string | null;
  targetCategory?: string | null;
  targetCourseId?: string | null;
  targetModuleId?: string | null;
  targetLessonId?: string | null;
};

type BadgeTargetCourse = {
  id: string;
  title: string;
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string }[];
  }[];
};

// Zod schema for client-side form validation
const badgeFormSchema = z
  .object({
    title: z.string().min(1, 'Judul badge wajib diisi.'),
    code: z.string().optional(),
    description: z.string().nullable().optional(),
    rarity: z.string(),
    sortOrder: z.coerce.number().min(0, 'Urutan tampil tidak boleh negatif.'),
    unlockRule: z.string(),
    unlockValue: z.preprocess((val) => {
      if (val === '' || val === null || val === undefined) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    }, z.number().int('Nilai harus berupa angka bulat.').nullable()),
    xpBonus: z.coerce.number().min(0, 'Bonus XP tidak boleh negatif.'),
    requirementText: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    targetLevel: z.string().nullable().optional(),
    targetCategory: z.string().nullable().optional(),
    targetCourseId: z.string().nullable().optional(),
    targetModuleId: z.string().nullable().optional(),
    targetLessonId: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      const needsScore = [
        'QUIZ_SCORE_THRESHOLD',
        'TRYOUT_SCORE_THRESHOLD',
      ].includes(data.unlockRule);
      if (needsScore) {
        return data.unlockValue !== null;
      }
      return true;
    },
    {
      message: 'Nilai skor minimum wajib diisi untuk kriteria ini.',
      path: ['unlockValue'],
    },
  )
  .refine(
    (data) => {
      const needsScore = [
        'QUIZ_SCORE_THRESHOLD',
        'TRYOUT_SCORE_THRESHOLD',
      ].includes(data.unlockRule);
      if (needsScore && data.unlockValue !== null) {
        return data.unlockValue >= 0 && data.unlockValue <= 100;
      }
      return true;
    },
    {
      message: 'Nilai skor harus di antara 0 dan 100.',
      path: ['unlockValue'],
    },
  )
  .refine(
    (data) => {
      if (data.unlockRule === 'SPECIFIC_COURSE_COMPLETE') {
        return Boolean(data.targetCourseId && data.targetCourseId.trim() !== '');
      }
      if (data.unlockRule === 'SPECIFIC_MODULE_COMPLETE') {
        return Boolean(data.targetCourseId && data.targetCourseId.trim() !== '');
      }
      return true;
    },
    {
      message: 'Target Kursus Spesifik wajib dipilih untuk kriteria ini.',
      path: ['targetCourseId'],
    },
  )
  .refine(
    (data) => {
      if (data.unlockRule === 'SPECIFIC_MODULE_COMPLETE') {
        return Boolean(data.targetModuleId && data.targetModuleId.trim() !== '');
      }
      return true;
    },
    {
      message: 'Target modul wajib dipilih.',
      path: ['targetModuleId'],
    },
  )
  .refine(
    (data) => {
      if (data.unlockRule === 'SPECIFIC_LESSON_COMPLETE') {
        return Boolean(data.targetCourseId && data.targetCourseId.trim() !== '');
      }
      return true;
    },
    {
      message: 'Pilih kursus terlebih dahulu.',
      path: ['targetCourseId'],
    },
  )
  .refine(
    (data) => {
      if (data.unlockRule === 'SPECIFIC_LESSON_COMPLETE') {
        return Boolean(data.targetCourseId && data.targetCourseId.trim() !== '');
      }
      return true;
    },
    {
      message: 'Pilih kursus terlebih dahulu.',
      path: ['targetCourseId'],
    },
  )
  .refine(
    (data) => {
      if (data.unlockRule === 'SPECIFIC_LESSON_COMPLETE') {
        return Boolean(data.targetModuleId && data.targetModuleId.trim() !== '');
      }
      return true;
    },
    {
      message: 'Pilih modul terlebih dahulu.',
      path: ['targetModuleId'],
    },
  )
  .refine(
    (data) => {
      if (data.unlockRule === 'SPECIFIC_LESSON_COMPLETE') {
        return Boolean(data.targetLessonId && data.targetLessonId.trim() !== '');
      }
      return true;
    },
    {
      message: 'Target lesson wajib dipilih.',
      path: ['targetLessonId'],
    },
  );

export function AdminBadgeFormPage({
  badge,
  r2Configured,
  courses = [],
}: {
  badge?: BadgeFormData;
  r2Configured: boolean;
  courses?: BadgeTargetCourse[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [removeImage, setRemoveImage] = useState(false);
  const [unlockRule, setUnlockRule] = useState(badge?.unlockRule ?? 'MANUAL');
  const [rarity, setRarity] = useState(badge?.rarity ?? 'COMMON');
  const [targetLevel, setTargetLevel] = useState<string>(badge?.targetLevel ?? '');
  const [targetCategory, setTargetCategory] = useState<string>(badge?.targetCategory ?? '');
  const [targetCourseId, setTargetCourseId] = useState<string>(badge?.targetCourseId ?? '');
  const [targetModuleId, setTargetModuleId] = useState<string>(badge?.targetModuleId ?? '');
  const [targetLessonId, setTargetLessonId] = useState<string>(badge?.targetLessonId ?? '');
  const [imagePreview, setImagePreview] = useState<string | null>(
    badge?.imageUrl && !removeImage ? badge.imageUrl : null,
  );
  const [imageOptimizing, setImageOptimizing] = useState(false);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const optimizedFileRef = useRef<File | null>(null);
  const previewBlobRef = useRef<string | null>(null);
  const isEdit = Boolean(badge?.id);
  const r2Ready = r2Configured;

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === targetCourseId) ?? null,
    [courses, targetCourseId],
  );
  const moduleOptions = selectedCourse?.modules ?? [];
  const selectedModule = useMemo(
    () => moduleOptions.find((module) => module.id === targetModuleId) ?? null,
    [moduleOptions, targetModuleId],
  );
  const lessonOptions = selectedModule?.lessons ?? [];

  useEffect(() => {
    return () => {
      if (previewBlobRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewBlobRef.current);
      }
    };
  }, []);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImageOptimizing(true);
    setImageHint(null);
    setRemoveImage(false);

    try {
      const optimized = await optimizeImageFileForUpload(file, {
        maxWidth: 512,
        maxHeight: 512,
      });
      optimizedFileRef.current = optimized.file;
      setHasNewImage(true);

      if (previewBlobRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewBlobRef.current);
      }
      previewBlobRef.current = optimized.previewUrl;
      setImagePreview(optimized.previewUrl);

      const savedPct =
        optimized.originalSize > optimized.optimizedSize
          ? Math.round((1 - optimized.optimizedSize / optimized.originalSize) * 100)
          : 0;
      setImageHint(
        savedPct > 0
          ? `Dioptimalkan ke WebP (${Math.round(optimized.optimizedSize / 1024)} KB, −${savedPct}%).`
          : `Siap diunggah (${Math.round(optimized.optimizedSize / 1024)} KB).`,
      );
    } catch {
      setError('Gagal memproses gambar. Coba file lain.');
      optimizedFileRef.current = null;
      setHasNewImage(false);
    } finally {
      setImageOptimizing(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setValidationErrors({});

    const form = event.currentTarget;
    const formData = new FormData(form);
    if (removeImage) formData.set('removeImage', 'true');
    if (optimizedFileRef.current) {
      formData.set('image', optimizedFileRef.current);
    }

    // Prepare data for validation
    const rawData = {
      title: formData.get('title'),
      code: formData.get('code'),
      description: formData.get('description'),
      rarity: rarity,
      sortOrder: formData.get('sortOrder'),
      unlockRule: unlockRule,
      unlockValue: formData.get('unlockValue'),
      xpBonus: formData.get('xpBonus'),
      requirementText: formData.get('requirementText'),
      imageUrl: formData.get('imageUrl'),
      targetLevel: targetLevel || null,
      targetCategory: targetCategory || null,
      targetCourseId: targetCourseId || null,
      targetModuleId: targetModuleId || null,
      targetLessonId: targetLessonId || null,
    };

    const validation = badgeFormSchema.safeParse(rawData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(fieldErrors);
      setError('Harap periksa kembali isian form Anda.');
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateBadgeAction(badge!.id!, formData)
        : await createBadgeAction(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(ADMIN_ROUTES.badges);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Gamifikasi"
      title={isEdit ? 'Edit Badge' : 'Badge Baru'}
      subtitle="Upload ke R2 jika dikonfigurasi; jika tidak, gambar disimpan ke public/badges (lokal/VPS). Atau pakai URL statis /badges/…"
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.badges}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      {!r2Ready ? (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          R2 belum dikonfigurasi atau token tidak punya izin tulis — upload gambar akan disimpan ke{' '}
          <code className="text-foreground">public/badges/</code> (cocok untuk dev/VPS). Untuk production
          dengan CDN, perbaiki env R2 atau gunakan field URL statis di bawah.
        </Card>
      ) : null}

      <Card className="max-w-xl border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="unlockRule" value={unlockRule} />
          <input type="hidden" name="rarity" value={rarity} />
          <input type="hidden" name="targetLevel" value={targetLevel} />
          <input type="hidden" name="targetCategory" value={targetCategory} />
          <input type="hidden" name="targetCourseId" value={targetCourseId} />
          <input type="hidden" name="targetModuleId" value={targetModuleId} />
          <input type="hidden" name="targetLessonId" value={targetLessonId} />

          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input
              id="title"
              name="title"
              defaultValue={badge?.title ?? ''}
              className={validationErrors.title ? 'border-destructive' : ''}
              required
            />
            {validationErrors.title && (
              <p className="text-xs text-destructive">{validationErrors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Kode (slug)</Label>
            <Input
              id="code"
              name="code"
              defaultValue={badge?.code ?? ''}
              placeholder="first-lesson"
              disabled={isEdit}
              required={!isEdit}
              className={validationErrors.code ? 'border-destructive' : ''}
            />
            {validationErrors.code ? (
              <p className="text-xs text-destructive">{validationErrors.code}</p>
            ) : isEdit ? (
              <p className="text-xs text-muted-foreground">Kode tidak bisa diubah setelah dibuat.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={badge?.description ?? ''} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rarity">Rarity</Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger id="rarity">
                  <SelectValue placeholder="Pilih rarity" />
                </SelectTrigger>
                <SelectContent>
                  {LMS_BADGE_RARITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Common (abu), Rare (biru), Epic (ungu), Legendary (emas).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Urutan tampil</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={badge?.sortOrder ?? 0}
              />
            </div>
          </div>

          {/* Aturan Unlock Section */}
          <div className="space-y-4 rounded-xl border border-border bg-muted/25 p-4">
            <div className="space-y-2">
              <Label htmlFor="unlockRule">Aturan unlock</Label>
              <Select
                value={unlockRule}
                onValueChange={(val) => {
                  setUnlockRule(val);
                  // Clear validation errors for these fields when rule changes
                  setValidationErrors((prev) => {
                    const copy = { ...prev };
                    delete copy.unlockValue;
                    delete copy.targetLevel;
                    delete copy.targetCategory;
                    delete copy.targetCourseId;
                    delete copy.targetModuleId;
                    delete copy.targetLessonId;
                    return copy;
                  });
                  if (!['SPECIFIC_COURSE_COMPLETE', 'SPECIFIC_MODULE_COMPLETE', 'SPECIFIC_LESSON_COMPLETE'].includes(val)) {
                    setTargetCourseId('');
                    setTargetModuleId('');
                    setTargetLessonId('');
                  }
                }}
              >
                <SelectTrigger id="unlockRule">
                  <SelectValue placeholder="Pilih aturan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual (admin grant)</SelectItem>
                  <SelectItem value="FIRST_LESSON">Lesson pertama selesai</SelectItem>
                  <SelectItem value="FIRST_QUIZ">Quiz pertama selesai</SelectItem>
                  <SelectItem value="QUIZ_SCORE_THRESHOLD">Skor kuis minimum</SelectItem>
                  <SelectItem value="CATEGORY_COMPLETE">Selesaikan kategori materi</SelectItem>
                  <SelectItem value="TRYOUT_SCORE_THRESHOLD">Skor tryout minimum</SelectItem>
                  <SelectItem value="SPECIFIC_COURSE_COMPLETE">Selesaikan kursus spesifik</SelectItem>
                  <SelectItem value="SPECIFIC_MODULE_COMPLETE">Selesaikan modul spesifik</SelectItem>
                  <SelectItem value="SPECIFIC_LESSON_COMPLETE">Selesaikan lesson spesifik</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Otomatis saat siswa memicu event belajar yang sesuai.
              </p>
            </div>

            {/* Conditional Fields Container */}
            {['QUIZ_SCORE_THRESHOLD', 'CATEGORY_COMPLETE', 'TRYOUT_SCORE_THRESHOLD', 'SPECIFIC_COURSE_COMPLETE', 'SPECIFIC_MODULE_COMPLETE', 'SPECIFIC_LESSON_COMPLETE'].includes(
              unlockRule,
            ) && (
              <div className="grid gap-4 pt-4 sm:grid-cols-2 border-t border-border/50">
                {/* Nilai Unlock (Skor Min %) */}
                {['QUIZ_SCORE_THRESHOLD', 'TRYOUT_SCORE_THRESHOLD'].includes(
                  unlockRule,
                ) && (
                  <div className="space-y-2">
                    <Label htmlFor="unlockValue" className="flex items-center gap-1">
                      Nilai unlock (skor min %) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="unlockValue"
                      name="unlockValue"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 80"
                      defaultValue={badge?.unlockValue ?? ''}
                      className={validationErrors.unlockValue ? 'border-destructive' : ''}
                    />
                    {validationErrors.unlockValue ? (
                      <p className="text-xs text-destructive">{validationErrors.unlockValue}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {unlockRule === 'QUIZ_SCORE_THRESHOLD'
                          ? 'Masukkan nilai 0-100 (misal: 100 untuk Perfect Master, 75 untuk High Performer).'
                          : 'Masukkan nilai minimum kelulusan tryout dalam persen (misal: 70 untuk N4 Daily Conversation).'}
                      </p>
                    )}
                  </div>
                )}

                {/* Target Level (JLPT) */}
                {['QUIZ_SCORE_THRESHOLD', 'CATEGORY_COMPLETE', 'TRYOUT_SCORE_THRESHOLD'].includes(
                  unlockRule,
                ) && (
                  <div className="space-y-2">
                    <Label htmlFor="targetLevel">Target Level (JLPT)</Label>
                    <Select value={targetLevel} onValueChange={setTargetLevel}>
                      <SelectTrigger id="targetLevel">
                        <SelectValue placeholder="Semua Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Semua Level</SelectItem>
                        <SelectItem value="N5">N5</SelectItem>
                        <SelectItem value="N4">N4</SelectItem>
                        <SelectItem value="N3">N3</SelectItem>
                        <SelectItem value="N2">N2</SelectItem>
                        <SelectItem value="N1">N1</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Batasi aturan ini pada level JLPT tertentu.
                    </p>
                  </div>
                )}

                {/* Target Kategori (Materi) */}
                {unlockRule === 'CATEGORY_COMPLETE' && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="targetCategory">Target Kategori (Materi)</Label>
                    <Select value={targetCategory} onValueChange={setTargetCategory}>
                      <SelectTrigger id="targetCategory">
                        <SelectValue placeholder="Semua Kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Semua Kategori</SelectItem>
                        <SelectItem value="KANJI">Kanji (漢字)</SelectItem>
                        <SelectItem value="KOSAKATA">Kosakata (語彙)</SelectItem>
                        <SelectItem value="TATA_BAHASA">Tata Bahasa (文法)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Tentukan skill track spesifik yang memicu badge.
                    </p>
                  </div>
                )}

                {/* Target Kursus Spesifik */}
                {['SPECIFIC_COURSE_COMPLETE', 'SPECIFIC_MODULE_COMPLETE', 'SPECIFIC_LESSON_COMPLETE'].includes(unlockRule) && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="targetCourseId">
                      Target Kursus <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={targetCourseId}
                      onValueChange={(value) => {
                        setTargetCourseId(value);
                        setTargetModuleId('');
                        setTargetLessonId('');
                      }}
                    >
                      <SelectTrigger
                        id="targetCourseId"
                        className={validationErrors.targetCourseId ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Pilih Kursus" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.targetCourseId ? (
                      <p className="text-xs text-destructive">{validationErrors.targetCourseId}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Pilih kursus sumber aturan badge.
                      </p>
                    )}
                  </div>
                )}

                {['SPECIFIC_MODULE_COMPLETE', 'SPECIFIC_LESSON_COMPLETE'].includes(unlockRule) && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="targetModuleId">
                        Target Modul <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={targetModuleId}
                        disabled={!targetCourseId}
                        onValueChange={(value) => {
                          setTargetModuleId(value);
                          setTargetLessonId('');
                        }}
                      >
                        <SelectTrigger
                          id="targetModuleId"
                          className={validationErrors.targetModuleId ? 'border-destructive' : ''}
                        >
                          <SelectValue
                            placeholder={
                              targetCourseId ? 'Pilih Modul' : 'Pilih kursus terlebih dahulu'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleOptions.length > 0 ? (
                            moduleOptions.map((module) => (
                              <SelectItem key={module.id} value={module.id}>
                                {module.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__no_module" disabled>
                              {targetCourseId
                                ? 'Kursus ini belum punya modul'
                                : 'Pilih kursus terlebih dahulu'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {validationErrors.targetModuleId ? (
                        <p className="text-xs text-destructive">{validationErrors.targetModuleId}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Modul hanya ditampilkan dari kursus yang dipilih.
                        </p>
                      )}
                    </div>

                    {unlockRule === 'SPECIFIC_LESSON_COMPLETE' ? (
                    <div className="space-y-2">
                      <Label htmlFor="targetLessonId">
                        Target Lesson <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={targetLessonId}
                        disabled={!targetModuleId}
                        onValueChange={setTargetLessonId}
                      >
                        <SelectTrigger
                          id="targetLessonId"
                          className={validationErrors.targetLessonId ? 'border-destructive' : ''}
                        >
                          <SelectValue
                            placeholder={
                              targetModuleId ? 'Pilih Lesson' : 'Pilih modul terlebih dahulu'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {lessonOptions.length > 0 ? (
                            lessonOptions.map((lesson) => (
                              <SelectItem key={lesson.id} value={lesson.id}>
                                {lesson.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__no_lesson" disabled>
                              {targetModuleId
                                ? 'Modul ini belum punya lesson'
                                : 'Pilih modul terlebih dahulu'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {validationErrors.targetLessonId ? (
                        <p className="text-xs text-destructive">{validationErrors.targetLessonId}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Lesson hanya ditampilkan dari modul yang dipilih.
                        </p>
                      )}
                    </div>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="xpBonus">Bonus XP saat unlock</Label>
              <Input
                id="xpBonus"
                name="xpBonus"
                type="number"
                min={0}
                placeholder="25 (standar)"
                defaultValue={badge?.xpBonus ?? 25}
                className={validationErrors.xpBonus ? 'border-destructive' : ''}
              />
              {validationErrors.xpBonus ? (
                <p className="text-xs text-destructive">{validationErrors.xpBonus}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Rekomendasi: 10 untuk Common, 25 untuk Rare/Epic, 50 untuk Legendary.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirementText">Teks syarat (tampilan siswa)</Label>
              <Input
                id="requirementText"
                name="requirementText"
                placeholder="Selesaikan lesson pertamamu"
                defaultValue={badge?.requirementText ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL gambar statis (opsional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              placeholder="/badges/Word Rookie.png"
              defaultValue={
                badge?.imageUrl?.startsWith('/badges/') ? badge.imageUrl : ''
              }
            />
            <p className="text-xs text-muted-foreground">
              Pakai file di <code>public/badges/</code> tanpa upload — mis. hasil seed awal.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Gambar badge (upload)</Label>
            {badge?.imageUrl && !removeImage && !hasNewImage ? (
              <div className="mb-2 flex items-center gap-3">
                <Image
                  src={badge.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 rounded-xl object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRemoveImage(true);
                    setImagePreview(null);
                    setImageHint(null);
                    optimizedFileRef.current = null;
                    setHasNewImage(false);
                  }}
                >
                  Hapus gambar
                </Button>
              </div>
            ) : null}
            {imagePreview ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <Image
                  src={imagePreview}
                  alt="Pratinjau badge"
                  width={80}
                  height={80}
                  unoptimized
                  className="size-20 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                  {imageOptimizing ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Mengoptimalkan gambar…
                    </span>
                  ) : (
                    imageHint ?? 'Pratinjau gambar yang akan diunggah.'
                  )}
                </div>
              </div>
            ) : null}
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              disabled={imageOptimizing || isPending}
            />
            <p className="text-xs text-muted-foreground">
              Upload PNG/JPEG/WebP (maks. 2 MB). R2 jika tersedia; jika gagal, disimpan ke public/badges.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Buat Badge'}
          </Button>
        </form>
      </Card>
    </AdminPageShell>
  );
}
