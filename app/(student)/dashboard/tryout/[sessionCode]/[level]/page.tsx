import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { TryoutExamWorkspace } from '@/features/tryout/components/tryout-exam-workspace';
import { getOrCreateTryoutExamProgress } from '@/features/tryout/actions/tryout-exam-progress-actions';
import { loadTryoutExam } from '@/features/student/lib/load-dashboard-extras';
import { evaluateTryoutAccess } from '@/features/tryout/lib/tryout-access';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { Button } from '@/components/ui/button';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

type PageProps = {
    params: Promise<{ sessionCode: string; level: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { sessionCode, level } = await params;
    return {
        title: `Ujian JLPT ${level} — ${sessionCode} — JepangKu LMS`,
        description: 'Simulasi ujian JLPT dengan timer dan bagian terpisah.',
    };
}

export default async function TryoutExamRoutePage({ params }: PageProps) {
    const { sessionCode, level: levelRaw } = await params;
    const level = levelRaw.toUpperCase();

    if (!LEVELS.includes(level as (typeof LEVELS)[number])) {
        redirect(STUDENT_ROUTES.tryout);
    }

    const exam = await loadTryoutExam(
        decodeURIComponent(sessionCode),
        level as (typeof LEVELS)[number],
    );
    if (!exam) notFound();

    const access = evaluateTryoutAccess({
        isStrictTimeBound: exam.session.isStrictTimeBound,
        scheduledAt: exam.session.scheduledAt,
        timeLimitMinutes: exam.session.timeLimitMinutes,
    });
    if (!access.ok) {
        return (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <h1 className="text-xl font-bold">Tryout belum dapat diakses</h1>
                <p className="mt-2 text-sm text-muted-foreground">{access.message}</p>
                <Button asChild className="mt-6">
                    <Link href={STUDENT_ROUTES.tryout}>Kembali</Link>
                </Button>
            </div>
        );
    }

    if (exam.empty) {
        return (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
                <h1 className="text-xl font-bold">Soal belum tersedia</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    Bank soal untuk {exam.session.phaseLabel} level {level} masih disiapkan.
                </p>
                <Button asChild className="mt-6">
                    <Link href={STUDENT_ROUTES.tryout}>Kembali</Link>
                </Button>
            </div>
        );
    }

    return (
        <TryoutExamWorkspace
            sessionCode={exam.session.code}
            sessionId={exam.session.id}
            sessionTitle={exam.session.title}
            level={level}
            timeLimitMinutes={exam.session.timeLimitMinutes}
            questions={exam.questions}
            examProgress={await getOrCreateTryoutExamProgress(exam.session.id, level as (typeof LEVELS)[number])}
        />
    );
}
