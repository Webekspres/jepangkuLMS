import { z } from 'zod';

/** Slug URL kursus/lesson: huruf kecil, angka, strip */
export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug wajib diisi')
  .max(120, 'Slug terlalu panjang')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda strip');

export const uuidSchema = z.uuid({ message: 'ID tidak valid' });

export const levelJlptSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1'], {
  message: 'Level JLPT tidak valid',
});

export const roleSchema = z.enum(['STUDENT', 'ADMIN'], {
  message: 'Role tidak valid',
});

export const enrollmentStatusSchema = z.enum(['PENDING', 'ACTIVE'], {
  message: 'Status enrollment tidak valid',
});

export const questionTypeSchema = z.enum(['QUIZ', 'TRYOUT'], {
  message: 'Tipe soal tidak valid',
});

export const categoryTypeSchema = z.enum(['KANJI', 'KOSAKATA', 'TATA_BAHASA'], {
  message: 'Kategori materi tidak valid',
});

export const badgeTypeSchema = z.enum(['UTAMA', 'MATERI', 'QUIZ', 'GLOBAL'], {
  message: 'Tipe badge tidak valid',
});

/** Params dinamis route belajar/kuis */
export const lessonSlugParamsSchema = z.object({
  lessonSlug: slugSchema,
});

export const courseLessonParamsSchema = z.object({
  courseSlug: slugSchema,
  lessonSlug: slugSchema,
});

export type LevelJlpt = z.infer<typeof levelJlptSchema>;
export type Slug = z.infer<typeof slugSchema>;
