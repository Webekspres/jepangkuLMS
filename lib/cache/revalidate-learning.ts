import { revalidatePath, updateTag } from 'next/cache';
import { LEARNING_CACHE_TAGS } from '@/lib/cache/learning-cache';

/** Invalidate cache & halaman siswa setelah konten kursus berubah di Admin CMS. */
export function revalidateStudentLearningSurfaces(options?: { lessonId?: string; userId?: string }) {
  updateTag(LEARNING_CACHE_TAGS.coursesCatalog);
  updateTag(LEARNING_CACHE_TAGS.allEnrollments);

  if (options?.lessonId) {
    updateTag(LEARNING_CACHE_TAGS.lessonMaterials(options.lessonId));
  }
  if (options?.userId) {
    updateTag(LEARNING_CACHE_TAGS.userEnrollments(options.userId));
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/kursus', 'layout');
  revalidatePath('/dashboard/belajar', 'layout');
  revalidatePath('/kursus');
}
