import { revalidatePath, revalidateTag } from 'next/cache';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';

/** Invalidate cache & halaman siswa setelah konten kursus berubah di Admin CMS. */
export function revalidateStudentLearningSurfaces(options?: { lessonId?: string; userId?: string }) {
  revalidateTag(LEARNING_CACHE_TAGS.coursesCatalog, 'default');
  revalidateTag(LEARNING_CACHE_TAGS.allEnrollments, 'default');

  if (options?.lessonId) {
    revalidateTag(LEARNING_CACHE_TAGS.lessonMaterials(options.lessonId), 'default');
  }
  if (options?.userId) {
    revalidateTag(LEARNING_CACHE_TAGS.userEnrollments(options.userId), 'default');
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus', 'layout');
  revalidatePath('/dashboard/belajar', 'layout');
  revalidatePath('/kursus');
}
