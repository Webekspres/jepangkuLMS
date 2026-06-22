'use client';

import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Grid3x3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { submitTryoutAttempt } from '@/features/tryout/actions/tryout-actions';
import type { TryoutExamQuestion } from '@/features/student/lib/load-dashboard-extras';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

const SECTION_COLORS: Record<string, string> = {
  MOJI_GOI: 'bg-blue-500',
  BUNPOU_DOKKAI: 'bg-violet-500',
  CHOKAI: 'bg-emerald-500',
};

type TryoutExamWorkspaceProps = {
  sessionCode: string;
  sessionTitle: string;
  level: string;
  timeLimitMinutes: number;
  questions: TryoutExamQuestion[];
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function resolveExamAudio(
  questions: TryoutExamQuestion[],
  current: TryoutExamQuestion,
): { url: string | null; playerKey: string; isGroup: boolean } {
  if (current.section !== 'CHOKAI') {
    return { url: null, playerKey: current.id, isGroup: false };
  }

  if (current.audioGroupId) {
    const carrier =
      questions.find((q) => q.audioGroupId === current.audioGroupId && q.audioUrl) ?? current;
    return {
      url: carrier.audioUrl,
      playerKey: `group-${current.audioGroupId}`,
      isGroup: true,
    };
  }

  return {
    url: current.audioUrl,
    playerKey: current.id,
    isGroup: false,
  };
}

function NavigatorGrid({
  questions,
  answers,
  flagged,
  currentIndex,
  onGoTo,
}: {
  questions: TryoutExamQuestion[];
  answers: Record<string, string>;
  flagged: Set<string>;
  currentIndex: number;
  onGoTo: (index: number) => void;
}) {
  const sections = [...new Set(questions.map((q) => q.section))];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        {[
          { color: 'bg-emerald-500', label: 'Terjawab' },
          { color: 'bg-primary', label: 'Saat ini' },
          { color: 'bg-amber-500', label: 'Ditandai' },
          { color: 'bg-muted', label: 'Belum' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-muted-foreground">
            <span className={cn('size-2.5 rounded-full', item.color)} />
            {item.label}
          </div>
        ))}
      </div>
      {sections.map((section) => (
        <div key={section} className="mb-4">
          <p className="mb-2 text-xs font-semibold text-foreground">
            {questions.find((q) => q.section === section)?.sectionLabel ?? section}
          </p>
          <div className="flex flex-wrap gap-2">
            {questions.map((question, index) => {
              if (question.section !== section) return null;
              const isCurrent = index === currentIndex;
              const isAnswered = Boolean(answers[question.id]);
              const isFlagged = flagged.has(question.id);
              return (
                <button
                  key={question.id}
                  type="button"
                  onClick={() => onGoTo(index)}
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl border-2 text-xs font-bold',
                    isCurrent && 'border-primary bg-primary text-primary-foreground',
                    !isCurrent && isFlagged && 'border-amber-400 bg-amber-50 text-amber-700',
                    !isCurrent && !isFlagged && isAnswered && 'border-emerald-400 bg-emerald-50 text-emerald-700',
                    !isCurrent && !isFlagged && !isAnswered && 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {question.sortOrder}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function TryoutExamWorkspace({
  sessionCode,
  sessionTitle,
  level,
  timeLimitMinutes,
  questions,
}: TryoutExamWorkspaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correct: number;
    total: number;
    pass: boolean;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const current = questions[currentIndex];
  const examAudio = resolveExamAudio(questions, current);
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 600;

  const handleFinish = async () => {
    startTransition(async () => {
      const response = await submitTryoutAttempt({
        sessionCode,
        level: level as 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
        answers,
      });
      if (!response.ok) return;
      setResult({
        score: response.score,
        correct: response.correct,
        total: response.total,
        pass: response.pass,
      });
      setShowFinishDialog(false);
    });
  };

  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          void handleFinish();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (result) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
          <div className="bg-linear-to-br from-secondary to-secondary/80 px-6 py-8 text-center text-white sm:px-8">
            <p className="text-4xl">{result.pass ? '🎉' : '💪'}</p>
            <h2 className="mt-3 text-2xl font-extrabold">
              {result.pass ? 'Bagus!' : 'Terus Berlatih!'}
            </h2>
            <p className="mt-1 text-sm text-white/70">
              JLPT {level} — {sessionTitle}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 p-6 sm:p-8">
            {[
              { label: 'Skor', value: `${result.correct}/${result.total}` },
              { label: 'Persentase', value: `${result.score}%` },
              { label: 'Status', value: result.pass ? 'LULUS' : 'BELUM' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-muted/30 p-3 text-center">
                <p className="text-lg font-extrabold text-primary">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 px-6 pb-8 sm:px-8">
            <Button asChild variant="outline" className="flex-1">
              <Link href={STUDENT_ROUTES.tryout}>← Pilih Sesi</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href={STUDENT_ROUTES.home}>Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col rounded-2xl border border-border bg-muted/20">
      <header className="sticky top-0 z-20 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={STUDENT_ROUTES.tryout} className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold">
                JLPT {level} — {sessionTitle}
              </h1>
              <p className="text-xs text-muted-foreground">
                {answeredCount}/{questions.length} terjawab
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold tabular-nums',
                isUrgent ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground',
              )}
            >
              <Clock className="size-3.5" />
              {formatTime(timeLeft)}
              {isUrgent ? <AlertTriangle className="size-3.5" /> : null}
            </div>
            <Button size="sm" onClick={() => setShowFinishDialog(true)} disabled={isPending}>
              Selesai Tes
            </Button>
          </div>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-1 bg-linear-to-r from-brand-red to-brand-yellow transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="flex flex-1">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-lg px-2.5 py-1 text-xs font-bold text-white',
                    SECTION_COLORS[current.section] ?? 'bg-muted-foreground',
                  )}
                >
                  {current.sectionLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  Soal {currentIndex + 1}/{questions.length}
                </span>
              </div>

              {examAudio.url ? (
                <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="mb-2 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                    {examAudio.isGroup
                      ? `Audio grup · ${current.audioGroupId}`
                      : 'Audio listening'}
                  </p>
                  <audio
                    key={examAudio.playerKey}
                    controls
                    preload="none"
                    className="w-full"
                    src={examAudio.url}
                  >
                    <track kind="captions" />
                  </audio>
                </div>
              ) : null}

              <div className="rounded-2xl border border-border bg-card p-5 sm:p-8">
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                  {current.questionText}
                </p>
                <div className="grid gap-2.5">
                  {current.options.map((option, index) => {
                    const selected = answers[current.id] === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [current.id]: option.id }))
                        }
                        className={cn(
                          'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-8 items-center justify-center rounded-full text-sm font-bold',
                            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-sm" style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}>
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 hidden items-center justify-between sm:flex">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() =>
                    setFlagged((prev) => {
                      const next = new Set(prev);
                      if (next.has(current.id)) next.delete(current.id);
                      else next.add(current.id);
                      return next;
                    })
                  }
                >
                  <Flag className="size-4" />
                  {flagged.has(current.id) ? 'Ditandai' : 'Tandai'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  >
                    <ChevronLeft className="size-4" />
                    Sebelumnya
                  </Button>
                  <Button
                    disabled={currentIndex >= questions.length - 1}
                    onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  >
                    Berikutnya
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        <aside className="hidden w-72 shrink-0 border-l border-border bg-card p-5 lg:block">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
            <BarChart2 className="size-4 text-primary" />
            Navigator Soal
          </h3>
          <NavigatorGrid
            questions={questions}
            answers={answers}
            flagged={flagged}
            currentIndex={currentIndex}
            onGoTo={setCurrentIndex}
          />
        </aside>
      </div>

      <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-card p-3 lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setShowNavigator(true)}>
          <Grid3x3 className="size-4" />
          Soal {currentIndex + 1}
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          size="icon"
          disabled={currentIndex >= questions.length - 1}
          onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <Dialog open={showNavigator} onOpenChange={setShowNavigator}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Navigator Soal</DialogTitle>
          </DialogHeader>
          <NavigatorGrid
            questions={questions}
            answers={answers}
            flagged={flagged}
            currentIndex={currentIndex}
            onGoTo={(index) => {
              setCurrentIndex(index);
              setShowNavigator(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Akhiri Tes Sekarang?</DialogTitle>
            <DialogDescription>
              Kamu baru menjawab {answeredCount} dari {questions.length} soal. Sisa waktu:{' '}
              {formatTime(timeLeft)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinishDialog(false)}>
              Lanjutkan Tes
            </Button>
            <Button onClick={() => void handleFinish()} disabled={isPending}>
              {isPending ? 'Menghitung…' : 'Ya, Akhiri Tes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
