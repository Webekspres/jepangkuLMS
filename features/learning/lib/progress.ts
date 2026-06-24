export type CourseProgress = {
  completedCount: number;
  totalCount: number;
  percent: number;
  continueLessonSlug: string | null;
  status: 'completed' | 'active' | 'not_started';
};

export function computeCourseProgressFromLessons(
  lessons: { slug: string; order: number }[],
  completedSlugs: Set<string>,
): CourseProgress {
  const totalCount = lessons.length;
  const completedCount = lessons.filter((l) => completedSlugs.has(l.slug)).length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const nextLesson = lessons.find((l) => !completedSlugs.has(l.slug));
  const continueLessonSlug = nextLesson?.slug ?? lessons[lessons.length - 1]?.slug ?? null;

  let status: CourseProgress['status'] = 'not_started';
  if (completedCount === totalCount && totalCount > 0) status = 'completed';
  else if (completedCount > 0) status = 'active';

  return { completedCount, totalCount, percent, continueLessonSlug, status };
}
