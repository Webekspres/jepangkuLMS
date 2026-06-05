interface KuisWorkspaceProps {
  params: Promise<{
    lessonSlug: string;
  }>;
}

export default async function KuisWorkspacePage({ params }: KuisWorkspaceProps) {
  const { lessonSlug } = await params;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-foreground">Workspace Kuis</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Mengerjakan kuis untuk lesson:{' '}
        <span className="font-semibold text-foreground">{lessonSlug}</span>
      </p>
    </div>
  );
}
