'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { TryoutAttemptReview } from '@/features/tryout/lib/load-tryout-review';
import {
  buildSectionAnalysisRows,
  getTryoutStatusTier,
  getWeakestSectionLabel,
} from '@/features/tryout/lib/tryout-result-insights';
import { TryoutResultRevealModal } from '@/features/tryout/components/tryout-result-reveal-modal';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const SECTION_COLORS: Record<string, string> = {
  MOJI_GOI: 'bg-blue-500',
  BUNPOU_DOKKAI: 'bg-violet-500',
  CHOKAI: 'bg-emerald-500',
};

const TIER_STYLES = {
  AMAN: 'text-emerald-600',
  PERLU_LATIHAN: 'text-brand-orange',
  SOS: 'text-primary',
} as const;

type TryoutReviewPageProps = {
  review: TryoutAttemptReview;
};

export function TryoutReviewPage({ review }: TryoutReviewPageProps) {
  const submittedLabel = new Date(review.submittedAt).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const tier = useMemo(() => getTryoutStatusTier(review.score), [review.score]);
  const sectionRows = useMemo(() => buildSectionAnalysisRows(review), [review]);
  const weakestSection = useMemo(() => getWeakestSectionLabel(sectionRows), [sectionRows]);

  return (
    <>
      <TryoutResultRevealModal
        displayName={review.displayName}
        level={review.level}
        correct={review.correct}
        total={review.total}
        score={review.score}
        pass={review.pass}
      />

      <div className="mx-auto max-w-3xl space-y-8 pb-12">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/30 px-4 py-4 sm:px-6">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Hasil Ujian JLPT
            </p>
            <h1 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
              JLPT {review.level} — {review.sessionTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {review.displayName} · {submittedLabel}
            </p>
          </div>

          <div className="grid gap-px border-b border-border bg-border sm:grid-cols-2">
            <div className="bg-card p-5 text-center sm:p-6">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Status Simulasi
              </p>
              <p
                className={cn(
                  'mt-2 text-3xl font-extrabold sm:text-4xl',
                  TIER_STYLES[tier.code],
                )}
              >
                {tier.label}
              </p>
            </div>
            <div className="bg-card p-5 text-center sm:p-6">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Perkiraan Tingkat Kelulusan
              </p>
              <p className="mt-2 text-3xl font-extrabold text-primary sm:text-4xl">
                {tier.passRateEstimate}%
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Estimasi berdasarkan pola simulasi internal JepangKu
              </p>
            </div>
          </div>

          <div className="border-b border-primary/15 bg-primary/5 p-4 sm:p-6">
            <p className="text-sm font-semibold text-foreground">{tier.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tier.feedback}</p>
            {weakestSection ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Bagian paling perlu diperkuat:{' '}
                <strong className="text-foreground">{weakestSection}</strong>
              </p>
            ) : null}
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {tier.tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-primary">·</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 sm:p-6">
            <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
              Ringkasan Skor per Bagian
            </h2>
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold">Bagian</TableHead>
                    <TableHead className="text-center font-bold">Benar</TableHead>
                    <TableHead className="text-center font-bold">Total</TableHead>
                    <TableHead className="text-center font-bold">Persentase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionRows.map((row) => {
                    const pct =
                      row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
                    return (
                      <TableRow key={row.section}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'size-2 rounded-full',
                                SECTION_COLORS[row.section] ?? 'bg-muted',
                              )}
                            />
                            {row.sectionLabel}
                          </span>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {row.correct}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{row.total}</TableCell>
                        <TableCell className="text-center font-semibold tabular-nums">
                          {pct}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/20 font-bold hover:bg-muted/20">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-center tabular-nums">{review.correct}</TableCell>
                    <TableCell className="text-center tabular-nums">{review.total}</TableCell>
                    <TableCell className="text-center tabular-nums text-primary">
                      {review.score}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Analisis per Bagian JLPT
          </h2>
          <Card className="overflow-hidden border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-bold">Bagian</TableHead>
                    <TableHead className="text-center font-bold">Jawaban Benar Kamu</TableHead>
                    <TableHead className="text-center font-bold">Minimal Lulus</TableHead>
                    <TableHead className="text-center font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionRows.map((row) => (
                    <TableRow key={row.section}>
                      <TableCell className="font-medium">{row.sectionLabel}</TableCell>
                      <TableCell className="text-center tabular-nums">
                        {row.correct}/{row.total}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{row.minToPass}</TableCell>
                      <TableCell className="text-center">
                        {row.passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                            <CheckCircle2 className="size-3.5" />
                            Memenuhi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                            <XCircle className="size-3.5" />
                            Kurang
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="mt-2 text-xs text-muted-foreground">
            Ambang minimal per bagian = 60% dari jumlah soal bagian tersebut (simulasi belajar, bukan
            skor JLPT resmi).
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Detail Jawaban per Soal
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
    </>
  );
}
