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

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}
