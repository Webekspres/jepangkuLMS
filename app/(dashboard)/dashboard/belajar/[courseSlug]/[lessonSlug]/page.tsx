interface BelajarPageProps {
  params: Promise<{
    courseSlug: string;
    lessonSlug: string;
  }>;
}

export default async function BelajarPage({ params }: BelajarPageProps) {
  const { courseSlug, lessonSlug } = await params;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">Course Workspace</h1>
      <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4 text-sm">
        <p className="font-semibold text-foreground">
          Course: <span className="text-primary">{courseSlug}</span>
        </p>
        <p className="mt-1 font-semibold text-foreground">
          Lesson: <span className="text-primary">{lessonSlug}</span>
        </p>
      </div>
    </div>
  );
}
