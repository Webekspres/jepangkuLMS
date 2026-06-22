import { z } from 'zod';
import { levelJlptSchema, slugSchema, uuidSchema } from '@/lib/validations/shared';

export { slugifyTitle } from '@/lib/lms/slug';

/** Empty or omitted — server auto-generates on create. */
export const optionalSlugField = z.string().trim().optional().or(z.literal(''));

const courseFields = {
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  level: levelJlptSchema,
  priceIdr: z.coerce.number().int().min(0, 'Harga tidak boleh negatif').max(99_999_999),
  isPublished: z.coerce.boolean(),
};

export const courseCreateFormSchema = z.object({
  ...courseFields,
  slug: optionalSlugField,
});

export const courseUpdateFormSchema = z.object({
  ...courseFields,
  slug: slugSchema,
});

/** @deprecated Use courseCreateFormSchema / courseUpdateFormSchema */
export const courseFormSchema = courseUpdateFormSchema;

const moduleFields = {
  courseId: uuidSchema,
  title: z.string().trim().min(1, 'Judul modul wajib diisi').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  order: z.coerce.number().int().min(1).max(999).optional(),
};

export const moduleCreateFormSchema = z.object({
  ...moduleFields,
  slug: optionalSlugField,
});

export const moduleUpdateFormSchema = z.object({
  courseId: uuidSchema,
  title: z.string().trim().min(1, 'Judul modul wajib diisi').max(200),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

/** @deprecated Use moduleCreateFormSchema / moduleUpdateFormSchema */
export const moduleFormSchema = moduleUpdateFormSchema;

const lessonFields = {
  moduleId: uuidSchema,
  courseId: uuidSchema,
  title: z.string().trim().min(1, 'Judul pelajaran wajib diisi').max(200),
  order: z.coerce.number().int().min(1).max(9999).optional(),
  content: z.string().trim().max(20000).optional().or(z.literal('')),
  videoUrl: z
    .string()
    .trim()
    .refine((val) => val === '' || z.string().url().safeParse(val).success, 'URL video tidak valid'),
};

export const lessonCreateFormSchema = z.object({
  ...lessonFields,
  slug: optionalSlugField,
});

export const lessonUpdateFormSchema = z.object({
  moduleId: uuidSchema,
  courseId: uuidSchema,
  title: z.string().trim().min(1, 'Judul pelajaran wajib diisi').max(200),
  slug: slugSchema,
  content: z.string().trim().max(20000).optional().or(z.literal('')),
  videoUrl: z
    .string()
    .trim()
    .refine((val) => val === '' || z.string().url().safeParse(val).success, 'URL video tidak valid'),
});

/** @deprecated Use lessonCreateFormSchema / lessonUpdateFormSchema */
export const lessonFormSchema = lessonUpdateFormSchema;

export type CourseFormInput = z.infer<typeof courseUpdateFormSchema>;
export type ModuleFormInput = z.infer<typeof moduleUpdateFormSchema>;
export type LessonFormInput = z.infer<typeof lessonUpdateFormSchema>;

export const kosakataMaterialSchema = z.object({
  lessonId: uuidSchema,
  courseId: uuidSchema,
  moduleId: uuidSchema,
  kosakata: z.string().trim().min(1, 'Kosakata wajib diisi'),
  furigana: z.string().trim().optional().or(z.literal('')),
  romaji: z.string().trim().optional().or(z.literal('')),
  arti: z.string().trim().min(1, 'Arti wajib diisi'),
  contohKalimat: z.string().trim().optional().or(z.literal('')),
});

export const kanjiMaterialSchema = z.object({
  lessonId: uuidSchema,
  courseId: uuidSchema,
  moduleId: uuidSchema,
  huruf: z.string().trim().min(1, 'Kanji wajib diisi'),
  furigana: z.string().trim().optional().or(z.literal('')),
  romaji: z.string().trim().optional().or(z.literal('')),
  arti: z.string().trim().min(1, 'Arti wajib diisi'),
  onyomi: z.string().trim().optional().or(z.literal('')),
  kunyomi: z.string().trim().optional().or(z.literal('')),
});

export const tataBahasaMaterialSchema = z.object({
  lessonId: uuidSchema,
  courseId: uuidSchema,
  moduleId: uuidSchema,
  tataBahasa: z.string().trim().min(1, 'Pola tata bahasa wajib diisi'),
  arti: z.string().trim().min(1, 'Arti wajib diisi'),
  contohKalimat: z.string().trim().optional().or(z.literal('')),
});

export const questionOptionSchema = z.object({
  text: z.string().trim().min(1, 'Teks opsi wajib diisi'),
  isCorrect: z.boolean(),
});

export const lessonQuestionSchema = z.object({
  lessonId: uuidSchema,
  courseId: uuidSchema,
  moduleId: uuidSchema,
  questionText: z.string().trim().min(1, 'Pertanyaan wajib diisi'),
  explanation: z.string().trim().optional().or(z.literal('')),
  xpReward: z.coerce.number().int().min(1).max(1000).default(10),
  options: z.array(questionOptionSchema).min(2, 'Minimal 2 opsi jawaban'),
});

export type KosakataMaterialInput = z.infer<typeof kosakataMaterialSchema>;
export type KanjiMaterialInput = z.infer<typeof kanjiMaterialSchema>;
export type TataBahasaMaterialInput = z.infer<typeof tataBahasaMaterialSchema>;
export type LessonQuestionInput = z.infer<typeof lessonQuestionSchema>;

export const tryoutQuestionSchema = z.object({
  tryoutSessionId: uuidSchema,
  tryoutLevel: levelJlptSchema,
  tryoutSection: z.enum(['MOJI_GOI', 'BUNPOU_DOKKAI', 'CHOKAI']),
  questionText: z.string().trim().min(1, 'Pertanyaan wajib diisi'),
  explanation: z.string().trim().max(5000).optional().or(z.literal('')),
  options: z.array(questionOptionSchema).min(2, 'Minimal 2 opsi jawaban'),
});

export type TryoutQuestionInput = z.infer<typeof tryoutQuestionSchema>;
