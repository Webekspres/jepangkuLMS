import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type QuizResultProps = {
  lessonSlug: string;
  lessonTitle: string;
  courseSlug: string;
  score: number;
  correct: number;
  total: number;
};

export function QuizResultView({
  lessonSlug,
  lessonTitle,
  courseSlug,
  score,
  correct,
  total,
}: QuizResultProps) {
  const passed = score >= 70;

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="size-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Hasil Kuis</CardTitle>
          <p className="text-sm text-muted-foreground">{lessonTitle}</p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-5xl font-extrabold tabular-nums text-primary">{score}%</p>
          <p className="text-sm text-muted-foreground">
            {correct} dari {total} jawaban benar
          </p>
          <p
            className={
              passed
                ? 'text-sm font-semibold text-emerald-600'
                : 'text-sm font-semibold text-amber-600'
            }
          >
            {passed ? 'Bagus! Kamu lulus kuis ini.' : 'Terus latihan — kamu hampir sampai!'}
          </p>
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline">
              <Link href={STUDENT_ROUTES.belajar(courseSlug, lessonSlug)}>Kembali ke materi</Link>
            </Button>
            <Button asChild>
              <Link href={STUDENT_ROUTES.kursusSaya}>Ke kursus saya</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
