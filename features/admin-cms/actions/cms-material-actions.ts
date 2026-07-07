'use server';

import { revalidatePath } from 'next/cache';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { revalidateStudentLearningSurfaces } from '@/lib/cache/revalidate-learning';
import { prisma } from '@/lib/prisma';
import type { CmsActionResult } from '@/features/admin-cms/actions/cms-course-actions';
import { assertLessonScope } from '@/features/admin-cms/lib/assert-lesson-scope';
import { assertLessonAllowsFlashcardMutation } from '@/features/admin-cms/lib/assert-lesson-type';
import { requireAdminAction } from '@/features/admin-cms/lib/require-admin-action';
import {
  kanjiMaterialSchema,
  kosakataMaterialSchema,
  tataBahasaMaterialSchema,
} from '@/features/admin-cms/lib/validations';

function revalidateLessonContent(courseId: string, moduleId: string, lessonId: string) {
  revalidateStudentLearningSurfaces({ lessonId });
  revalidatePath(ADMIN_ROUTES.kursusLessonForm(courseId, moduleId));
  revalidatePath(ADMIN_ROUTES.kursusLessons(courseId, moduleId));
}

async function ensureFlashcardLesson(lessonId: string): Promise<CmsActionResult | null> {
  try {
    await assertLessonAllowsFlashcardMutation(lessonId);
    return null;
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Lesson ini tidak menerima materi flashcard.',
    };
  }
}

export async function createKosakataMaterialAction(
  input: unknown,
): Promise<CmsActionResult & { id?: string }> {
  await requireAdminAction();
  const parsed = kosakataMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureFlashcardLesson(data.lessonId);
  if (typeError) return typeError;

  const row = await prisma.materialKosakata.create({
    data: {
      lessonId: data.lessonId,
      kosakata: data.kosakata,
      furigana: data.furigana || null,
      romaji: data.romaji || null,
      arti: data.arti,
      contohKalimat: data.contohKalimat || null,
    },
  });

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true, id: row.id };
}

export async function updateKosakataMaterialAction(
  materialId: string,
  input: unknown,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = kosakataMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureFlashcardLesson(data.lessonId);
  if (typeError) return typeError;

  const existing = await prisma.materialKosakata.findFirst({
    where: { id: materialId, lessonId: data.lessonId },
  });
  if (!existing) return { ok: false, message: 'Materi kosakata tidak ditemukan.' };

  await prisma.materialKosakata.update({
    where: { id: materialId },
    data: {
      kosakata: data.kosakata,
      furigana: data.furigana || null,
      romaji: data.romaji || null,
      arti: data.arti,
      contohKalimat: data.contohKalimat || null,
    },
  });

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true };
}

export async function deleteKosakataMaterialAction(
  courseId: string,
  moduleId: string,
  lessonId: string,
  materialId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await assertLessonScope(courseId, moduleId, lessonId);
  const typeError = await ensureFlashcardLesson(lessonId);
  if (typeError) return typeError;

  const existing = await prisma.materialKosakata.findFirst({
    where: { id: materialId, lessonId },
  });
  if (!existing) return { ok: false, message: 'Materi tidak ditemukan.' };

  await prisma.materialKosakata.delete({ where: { id: materialId } });
  revalidateLessonContent(courseId, moduleId, lessonId);
  return { ok: true };
}

export async function createKanjiMaterialAction(
  input: unknown,
): Promise<CmsActionResult & { id?: string }> {
  await requireAdminAction();
  const parsed = kanjiMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureFlashcardLesson(data.lessonId);
  if (typeError) return typeError;

  const row = await prisma.materialKanji.create({
    data: {
      lessonId: data.lessonId,
      huruf: data.huruf,
      furigana: data.furigana || null,
      romaji: data.romaji || null,
      arti: data.arti,
      onyomi: data.onyomi || null,
      kunyomi: data.kunyomi || null,
    },
  });

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true, id: row.id };
}

export async function updateKanjiMaterialAction(
  materialId: string,
  input: unknown,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = kanjiMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureFlashcardLesson(data.lessonId);
  if (typeError) return typeError;

  const existing = await prisma.materialKanji.findFirst({
    where: { id: materialId, lessonId: data.lessonId },
  });
  if (!existing) return { ok: false, message: 'Materi kanji tidak ditemukan.' };

  await prisma.materialKanji.update({
    where: { id: materialId },
    data: {
      huruf: data.huruf,
      furigana: data.furigana || null,
      romaji: data.romaji || null,
      arti: data.arti,
      onyomi: data.onyomi || null,
      kunyomi: data.kunyomi || null,
    },
  });

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true };
}

export async function deleteKanjiMaterialAction(
  courseId: string,
  moduleId: string,
  lessonId: string,
  materialId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await assertLessonScope(courseId, moduleId, lessonId);
  const typeError = await ensureFlashcardLesson(lessonId);
  if (typeError) return typeError;

  const existing = await prisma.materialKanji.findFirst({
    where: { id: materialId, lessonId },
  });
  if (!existing) return { ok: false, message: 'Materi tidak ditemukan.' };

  await prisma.materialKanji.delete({ where: { id: materialId } });
  revalidateLessonContent(courseId, moduleId, lessonId);
  return { ok: true };
}

export async function createTataBahasaMaterialAction(
  input: unknown,
): Promise<CmsActionResult & { id?: string }> {
  await requireAdminAction();
  const parsed = tataBahasaMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureFlashcardLesson(data.lessonId);
  if (typeError) return typeError;

  const row = await prisma.materialTataBahasa.create({
    data: {
      lessonId: data.lessonId,
      tataBahasa: data.tataBahasa,
      arti: data.arti,
      contohKalimat: data.contohKalimat || null,
    },
  });

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true, id: row.id };
}

export async function updateTataBahasaMaterialAction(
  materialId: string,
  input: unknown,
): Promise<CmsActionResult> {
  await requireAdminAction();
  const parsed = tataBahasaMaterialSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  await assertLessonScope(data.courseId, data.moduleId, data.lessonId);
  const typeError = await ensureFlashcardLesson(data.lessonId);
  if (typeError) return typeError;

  const existing = await prisma.materialTataBahasa.findFirst({
    where: { id: materialId, lessonId: data.lessonId },
  });
  if (!existing) return { ok: false, message: 'Materi tata bahasa tidak ditemukan.' };

  await prisma.materialTataBahasa.update({
    where: { id: materialId },
    data: {
      tataBahasa: data.tataBahasa,
      arti: data.arti,
      contohKalimat: data.contohKalimat || null,
    },
  });

  revalidateLessonContent(data.courseId, data.moduleId, data.lessonId);
  return { ok: true };
}

export async function deleteTataBahasaMaterialAction(
  courseId: string,
  moduleId: string,
  lessonId: string,
  materialId: string,
): Promise<CmsActionResult> {
  await requireAdminAction();
  await assertLessonScope(courseId, moduleId, lessonId);
  const typeError = await ensureFlashcardLesson(lessonId);
  if (typeError) return typeError;

  const existing = await prisma.materialTataBahasa.findFirst({
    where: { id: materialId, lessonId },
  });
  if (!existing) return { ok: false, message: 'Materi tidak ditemukan.' };

  await prisma.materialTataBahasa.delete({ where: { id: materialId } });
  revalidateLessonContent(courseId, moduleId, lessonId);
  return { ok: true };
}
