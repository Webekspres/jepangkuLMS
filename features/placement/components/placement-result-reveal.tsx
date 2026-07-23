'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Compass, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import type { LevelJLPT } from '@prisma/client';

type PlacementResultRevealProps = {
  attemptId: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  recommendedLevel: LevelJLPT;
  blurb: string;
  paperTitle: string;
  completedAt: Date;
};

function RingScore({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative mx-auto grid size-28 place-items-center sm:size-36">
      <svg viewBox="0 0 140 140" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="placementScoreRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand-red)" />
            <stop offset="60%" stopColor="var(--color-brand-orange)" />
            <stop offset="100%" stopColor="var(--color-brand-yellow)" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-white/10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#placementScoreRing)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progress }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="relative text-center">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/65 uppercase">Skor</p>
        <p className="mt-0.5 text-2xl font-extrabold text-white sm:text-3xl">{score}%</p>
      </div>
    </div>
  );
}

export function PlacementResultReveal({
  attemptId,
  score,
  correctCount,
  totalQuestions,
  recommendedLevel,
  blurb,
  paperTitle,
  completedAt,
}: PlacementResultRevealProps) {
  const jalurLabel =
    recommendedLevel === 'N4' ? 'Siap jalur N4' : 'Perkuat jalur N5';

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-brand-hero-navy text-white shadow-lg">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-red/15 via-transparent to-brand-yellow/10"
        aria-hidden
      />

      <div className="relative px-5 py-6 text-center sm:px-8 sm:py-8">
        <motion.p
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Compass className="size-3.5 text-brand-yellow" />
          {paperTitle}
        </motion.p>

        <motion.p
          className="mt-5 text-[11px] font-bold tracking-[0.2em] text-brand-yellow uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
        >
          Rekomendasi jalur
        </motion.p>

        <motion.h1
          className="mt-1 text-5xl font-extrabold tracking-tight sm:text-6xl"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          {recommendedLevel}
        </motion.h1>

        <motion.p
          className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.18 }}
        >
          {blurb}
        </motion.p>

        <motion.div
          className="mx-auto mt-6 flex max-w-md flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.22 }}
        >
          <RingScore score={score} />
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-44 sm:grid-cols-1">
            <div className="rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-left">
              <p className="text-[10px] font-semibold tracking-wide text-white/55 uppercase">Benar</p>
              <p className="mt-0.5 text-lg font-extrabold text-brand-yellow">
                {correctCount}/{totalQuestions}
              </p>
            </div>
            <div className="rounded-xl border border-white/12 bg-white/8 px-3 py-2.5 text-left">
              <p className="text-[10px] font-semibold tracking-wide text-white/55 uppercase">Jalur</p>
              <p className="mt-0.5 text-lg font-extrabold text-white">{jalurLabel}</p>
            </div>
          </div>
        </motion.div>

        <motion.p
          className="mt-5 text-xs text-white/55"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          Selesai{' '}
          {completedAt.toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </motion.p>

        <motion.div
          className="mt-5 flex w-full flex-col gap-3 sm:flex-row sm:justify-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button asChild size="lg" className="w-full gap-2 bg-brand-red hover:bg-brand-orange sm:w-auto">
            <Link href={STUDENT_ROUTES.kursus}>
              <Sparkles className="size-4" />
              Lihat kursus
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white sm:w-auto"
          >
            <Link href={STUDENT_ROUTES.placementExam}>
              <RotateCcw className="size-4" />
              Ulangi tes
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white sm:w-auto"
          >
            <Link href={STUDENT_ROUTES.placement}>Ringkasan</Link>
          </Button>
        </motion.div>

        {attemptId ? <span className="sr-only">Attempt {attemptId}</span> : null}
      </div>
    </div>
  );
}
