'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { TryoutAttemptReview } from '@/features/tryout/lib/load-tryout-review';
import {
  buildJlptCefrAnalysis,
  buildSectionAnalysisRows,
  buildTryoutFeedback,
} from '@/features/tryout/lib/tryout-result-insights';
import {
  formatCefrBandRange,
  getJlptLevelCefrConfig,
  JLPT_TOTAL_MAX_SCORE,
} from '@/features/tryout/lib/jlpt-cefr-reference';
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

const CEFR_STYLES: Record<string, string> = {
  A1: 'text-pink-600',
  A2: 'text-amber-600',
  B1: 'text-emerald-600',
  B2: 'text-blue-600',
  C1: 'text-violet-600',
};

type TryoutReviewPageProps = {
  review: TryoutAttemptReview;
};

export function TryoutReviewPage({ review }: TryoutReviewPageProps) {
  const submittedLabel = new Date(review.submittedAt).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const sectionRows = useMemo(() => buildSectionAnalysisRows(review), [review]);
  const jlptCefr = useMemo(
    () =>
      buildJlptCefrAnalysis({
        level: review.level,
        correct: review.correct,
        total: review.total,
        sectionBreakdown: review.sectionBreakdown,
      }),
    [review],
  );
  const feedback = useMemo(
    () =>
      buildTryoutFeedback({
        scorePercent: review.score,
        correct: review.correct,
        total: review.total,
        sectionRows,
        jlptPassOverall: jlptCefr.jlptPassOverall,
        indicatedCefr: jlptCefr.indicatedCefr,
        level: review.level,
      }),
    [review, sectionRows, jlptCefr],
  );
  const levelConfig = useMemo(() => getJlptLevelCefrConfig(review.level), [review.level]);

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

          <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
            <div className="bg-card p-5 text-center sm:p-6">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Status Simulasi
              </p>
              <p
                className={cn(
                  'mt-2 text-3xl font-extrabold sm:text-4xl',
                  TIER_STYLES[feedback.tier.code],
                )}
              >
                {feedback.tier.label}
              </p>
            </div>
            <div className="bg-card p-5 text-center sm:p-6">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Skor Setara JLPT
              </p>
              <p className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl tabular-nums">
                {jlptCefr.scaledTotalScore}
                <span className="text-lg font-semibold text-muted-foreground">
                  /{JLPT_TOTAL_MAX_SCORE}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Proyeksi dari {review.correct}/{review.total} benar ({review.score}%)
              </p>
            </div>
            <div className="bg-card p-5 text-center sm:p-6">
              <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                Level CEFR Terindikasi
              </p>
              {jlptCefr.indicatedCefr ? (
                <>
                  <p
                    className={cn(
                      'mt-2 text-3xl font-extrabold sm:text-4xl',
                      CEFR_STYLES[jlptCefr.indicatedCefr],
                    )}
                  >
                    {jlptCefr.indicatedCefr}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {jlptCefr.cefrBandDescription} · JLPT {review.level}
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-lg font-bold text-muted-foreground">Di bawah ambang</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Minimal {jlptCefr.totalPassScore}/{JLPT_TOTAL_MAX_SCORE} untuk indikasi CEFR
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-primary/15 bg-primary/5 p-4 sm:p-6">
            <p className="text-sm font-semibold text-foreground">{feedback.headline}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feedback.feedback}</p>
            {feedback.sectionNote ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {feedback.sectionNote}
                {feedback.sectionNoteEmphasis ? (
                  <>
                    {' '}
                    <strong className="text-foreground">{feedback.sectionNoteEmphasis}</strong>
                  </>
                ) : null}
              </p>
            ) : null}
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {feedback.tips.map((tip) => (
                <li key={tip} className="flex gap-2">
                  <span className="text-primary">·</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
            Analisis Kelulusan JLPT × CEFR
          </h2>
          <Card className="overflow-hidden border-border">
            <CardHeader className="border-b border-border bg-muted/20 py-4">
              <CardTitle className="text-base font-semibold">
                Referensi standar JLPT {review.level} — CEFR
              </CardTitle>
              <p className="text-xs leading-relaxed text-muted-foreground">
                JepangKu memetakan hasil simulasi ke skala resmi JLPT (0–180) dan level CEFR yang
                digunakan dalam sertifikasi JLPT saat ini. Kelulusan JLPT mensyaratkan skor total
                dan ambang per bagian ujian.
              </p>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                    Batas minimum lulus (total)
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {jlptCefr.totalPassScore} / {JLPT_TOTAL_MAX_SCORE}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                      (~{jlptCefr.totalPassPercent}% benar)
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Skor kamu:{' '}
                    <strong className="text-foreground">{jlptCefr.scaledTotalScore}</strong>
                    {jlptCefr.meetsJlptTotalPass ? (
                      <span className="ml-1 text-emerald-600">· Memenuhi</span>
                    ) : (
                      <span className="ml-1 text-destructive">· Belum memenuhi</span>
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-4">
                  <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
                    Kelulusan JLPT keseluruhan
                  </p>
                  <p className="mt-1 text-lg font-bold">
                    {jlptCefr.jlptPassOverall ? (
                      <span className="text-emerald-600">Memenuhi syarat</span>
                    ) : (
                      <span className="text-destructive">Belum memenuhi syarat</span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Total + semua bagian ujian harus memenuhi ambang minimal.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="font-bold">Level CEFR</TableHead>
                      <TableHead className="text-center font-bold">Rentang skor JLPT</TableHead>
                      <TableHead className="text-center font-bold">Status kamu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm text-muted-foreground" colSpan={3}>
                        Di bawah {jlptCefr.totalPassScore} poin — di luar indikasi CEFR
                      </TableCell>
                    </TableRow>
                    {jlptCefr.cefrBands.map((band) => {
                      const active = jlptCefr.indicatedCefr === band.cefr;
                      return (
                        <TableRow
                          key={band.cefr}
                          className={active ? 'bg-primary/5 hover:bg-primary/5' : undefined}
                        >
                          <TableCell
                            className={cn(
                              'font-bold',
                              CEFR_STYLES[band.cefr],
                            )}
                          >
                            {band.cefr}
                          </TableCell>
                          <TableCell className="text-center text-sm tabular-nums">
                            {formatCefrBandRange(band)}
                          </TableCell>
                          <TableCell className="text-center">
                            {active ? (
                              <span className="text-xs font-semibold text-primary">Terindikasi</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold tracking-wide text-muted-foreground uppercase">
                  Kelulusan per Bagian Ujian
                </h3>
                <div className="overflow-hidden rounded-xl border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="font-bold">Bagian resmi JLPT</TableHead>
                        <TableHead className="text-center font-bold">Benar</TableHead>
                        <TableHead className="text-center font-bold">%</TableHead>
                        <TableHead className="text-center font-bold">Skor setara</TableHead>
                        <TableHead className="text-center font-bold">Minimal lulus</TableHead>
                        <TableHead className="text-center font-bold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jlptCefr.officialSectionRows.map((row) => {
                        const group = levelConfig.sectionGroups.find((g) => g.key === row.key);
                        const pct =
                          row.total > 0 ? Math.round((row.correct / row.total) * 100) : 0;
                        return (
                          <TableRow key={row.key}>
                            <TableCell>
                              <p className="font-medium">{row.label}</p>
                              {group && group.sections.length > 1 ? (
                                <p className="mt-0.5 text-[11px] text-muted-foreground">
                                  {group.sections
                                    .map((section) => {
                                      const meta = sectionRows.find((s) => s.section === section);
                                      return meta?.sectionLabel ?? section;
                                    })
                                    .join(' + ')}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {row.correct}/{row.total}
                            </TableCell>
                            <TableCell className="text-center font-semibold tabular-nums">
                              {pct}%
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {row.scaledScore}/{row.scaledMax}
                            </TableCell>
                            <TableCell className="text-center tabular-nums">
                              {row.scaledMinPass}/{row.scaledMax}
                              <span className="block text-[10px] text-muted-foreground">
                                (min. {row.minToPass} benar)
                              </span>
                            </TableCell>
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
                        );
                      })}
                      <TableRow className="bg-muted/20 font-bold hover:bg-muted/20">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-center tabular-nums">
                          {review.correct}/{review.total}
                        </TableCell>
                        <TableCell className="text-center tabular-nums text-primary">
                          {review.score}%
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {jlptCefr.scaledTotalScore}/{JLPT_TOTAL_MAX_SCORE}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {jlptCefr.totalPassScore}/{JLPT_TOTAL_MAX_SCORE}
                        </TableCell>
                        <TableCell className="text-center">
                          {jlptCefr.jlptPassOverall ? (
                            <span className="text-xs font-semibold text-emerald-600">Memenuhi</span>
                          ) : (
                            <span className="text-xs font-semibold text-destructive">Kurang</span>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  N5/N4 menggabungkan MOJI GOI + BUNPOU DOKKAI sebagai satu bagian (120 poin).
                  N3–N1 memisahkan ketiga bagian (masing-masing 60 poin).
                </p>
              </div>
            </CardContent>
          </Card>
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
