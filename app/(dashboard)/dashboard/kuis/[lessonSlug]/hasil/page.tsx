interface KuisHasilProps {
  params: Promise<{
    lessonSlug: string;
  }>;
}

export default async function KuisHasilPage({ params }: KuisHasilProps) {
  const { lessonSlug } = await params;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">Hasil Evaluasi Kuis</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Review skor dan pembahasan kuis untuk:{' '}
        <span className="font-semibold text-foreground">{lessonSlug}</span>
      </p>
    </div>
  );
}
