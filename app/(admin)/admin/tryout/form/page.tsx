import { AdminTryoutSessionFormPage } from '@/features/admin-cms/components/admin-tryout-session-form';
import { loadReadyQuestionSetsForPicker } from '@/features/admin-cms/lib/load-admin-jlpt-question-sets';
import { loadAdminTryoutSessionById } from '@/features/admin-cms/lib/load-admin-tryout-sessions';
import { prisma } from '@/lib/prisma';
import {
  buildJlptCompleteness,
  countFlattenedBySection,
} from '@/features/admin-cms/lib/jlpt-question-set-stats';

type PageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminTryoutFormRoutePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const id = params.id?.trim();
  const session = id ? await loadAdminTryoutSessionById(id) : null;
  const packages = await loadReadyQuestionSetsForPicker();

  // Keep currently attached package visible even if no longer READY.
  if (session?.questionSetId && !packages.some((p) => p.id === session.questionSetId)) {
    const current = await prisma.jlptQuestionSet.findUnique({
      where: { id: session.questionSetId },
      include: {
        items: {
          select: {
            section: true,
            jlptQuestionId: true,
            listeningStimulus: { select: { _count: { select: { questions: true } } } },
          },
        },
      },
    });
    if (current) {
      const counts = countFlattenedBySection(current.items);
      packages.unshift({
        id: current.id,
        code: current.code,
        title: `${current.title} (${current.status})`,
        level: current.level,
        completeness: buildJlptCompleteness(counts),
        totalQuestions: counts.totalQuestions,
      });
    }
  }

  return (
    <AdminTryoutSessionFormPage session={session ?? undefined} packages={packages} />
  );
}
