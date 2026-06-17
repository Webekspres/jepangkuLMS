import { z } from 'zod';
import { levelJlptSchema, slugSchema, uuidSchema } from '@/lib/validations/shared';

export const courseFormSchema = z.object({
  title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
  slug: slugSchema,
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  level: levelJlptSchema,
  isPublished: z.coerce.boolean(),
});

export const moduleFormSchema = z.object({
  courseId: uuidSchema,
  title: z.string().trim().min(1, 'Judul modul wajib diisi').max(200),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  order: z.coerce.number().int().min(1).max(999),
});

export const lessonFormSchema = z.object({
  moduleId: uuidSchema,
  courseId: uuidSchema,
  title: z.string().trim().min(1, 'Judul pelajaran wajib diisi').max(200),
  slug: slugSchema,
  order: z.coerce.number().int().min(1).max(9999),
  content: z.string().trim().max(20000).optional().or(z.literal('')),
  videoUrl: z
    .string()
    .trim()
    .refine((val) => val === '' || z.string().url().safeParse(val).success, 'URL video tidak valid'),
});

export type CourseFormInput = z.infer<typeof courseFormSchema>;
export type ModuleFormInput = z.infer<typeof moduleFormSchema>;
export type LessonFormInput = z.infer<typeof lessonFormSchema>;

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

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}
