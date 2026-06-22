'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { TryoutAttemptReview } from '@/features/tryout/lib/load-tryout-review';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const SECTION_COLORS: Record<string, string> = {
  MOJI_GOI: 'bg-blue-500',
  BUNPOU_DOKKAI: 'bg-violet-500',
  CHOKAI: 'bg-emerald-500',
};

type TryoutReviewPageProps = {
  review: TryoutAttemptReview;
};

export function TryoutReviewPage({ review }: TryoutReviewPageProps) {
  const submittedLabel = new Date(review.submittedAt).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-12">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="bg-linear-to-br from-secondary to-secondary/80 px-6 py-8 text-center text-white sm:px-8">
          <p className="text-4xl">{review.pass ? '🎉' : '💪'}</p>
          <h1 className="mt-3 text-2xl font-extrabold">
            {review.pass ? 'Bagus!' : 'Terus Berlatih!'}
          </h1>
          <p className="mt-1 text-sm text-white/70">
            JLPT {review.level} — {review.sessionTitle}
          </p>
          <p className="mt-1 text-xs text-white/50">{submittedLabel}</p>
        </div>
        <div className="grid grid-cols-3 gap-3 p-6 sm:p-8">
          {[
            { label: 'Skor', value: `${review.correct}/${review.total}` },
            { label: 'Persentase', value: `${review.score}%` },
            { label: 'Status', value: review.pass ? 'LULUS' : 'BELUM' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-border bg-muted/30 p-3 text-center"
            >
              <p className="text-lg font-extrabold text-primary">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Ringkasan per Bagian
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {review.sectionBreakdown.map((row) => (
            <Card key={row.section} className="border-border">
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    'size-2.5 shrink-0 rounded-full',
                    SECTION_COLORS[row.section] ?? 'bg-muted',
                  )}
                />
                <div>
                  <p className="text-sm font-bold">{row.sectionLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.correct}/{row.total} benar
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
          Analisa Jawaban
        </h2>
        <div className="space-y-4">
          {review.questions.map((question) => (
            <Card
              key={question.id}
              className={cn(
                'overflow-hidden border-2',
                question.isCorrect ? 'border-emerald-500/30' : 'border-destructive/20',
              )}
            >
              <CardHeader className="border-b border-border bg-muted/20 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'rounded-md px-2 py-0.5 text-[10px] font-bold text-white',
                          SECTION_COLORS[question.section] ?? 'bg-muted-foreground',
                        )}
                      >
                        {question.sectionLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Soal {question.examNumber}
                      </span>
                    </div>
                    <CardTitle
                      className="text-sm font-medium leading-relaxed whitespace-pre-line"
                      style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                    >
                      {question.questionText}
                    </CardTitle>
                  </div>
                  {question.isCorrect ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-destructive" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 px-3 py-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                      Jawaban kamu
                    </p>
                    <p
                      className={cn(
                        'mt-1 text-sm font-medium',
                        question.isCorrect ? 'text-emerald-700' : 'text-destructive',
                      )}
                      style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                    >
                      {question.selectedOptionText ?? '— (kosong)'}
                    </p>
                  </div>
                  {!question.isCorrect ? (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
                      <p className="text-[10px] font-semibold text-emerald-800 uppercase">
                        Jawaban benar
                      </p>
                      <p
                        className="mt-1 text-sm font-medium text-emerald-800"
                        style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                      >
                        {question.correctOptionText ?? '—'}
                      </p>
                    </div>
                  ) : null}
                </div>
                {question.explanation ? (
                  <p className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Penjelasan: </span>
                    {question.explanation}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild variant="outline" className="flex-1">
          <Link href={STUDENT_ROUTES.tryout}>← Pilih Sesi Lain</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href={STUDENT_ROUTES.home}>Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
