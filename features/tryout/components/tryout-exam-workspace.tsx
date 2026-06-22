'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
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
import { TryoutFocusShell } from '@/features/tryout/components/tryout-focus-shell';
import { TryoutSectionIntro } from '@/features/tryout/components/tryout-section-intro';
import type { TryoutExamQuestion } from '@/features/student/lib/load-dashboard-extras';
import {
  getTryoutSectionProgress,
  TRYOUT_SECTIONS,
  type TryoutSectionValue,
} from '@/features/admin-cms/lib/tryout-sections';
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

type ExamPhase = 'section-intro' | 'section-exam';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function resolveExamAudio(
  sectionQuestions: TryoutExamQuestion[],
  current: TryoutExamQuestion,
): { url: string | null; playerKey: string; isGroup: boolean } {
  if (current.section !== 'CHOKAI') {
    return { url: null, playerKey: current.id, isGroup: false };
  }

  if (current.audioGroupId) {
    const carrier =
      sectionQuestions.find((q) => q.audioGroupId === current.audioGroupId && q.audioUrl) ??
      current;
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

function SectionNavigator({
  sectionQuestions,
  answers,
  flagged,
  currentQuestionId,
  onGoTo,
}: {
  sectionQuestions: TryoutExamQuestion[];
  answers: Record<string, string>;
  flagged: Set<string>;
  currentQuestionId: string;
  onGoTo: (index: number) => void;
}) {
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
      <div className="flex flex-wrap gap-2">
        {sectionQuestions.map((question, index) => {
          const isCurrent = question.id === currentQuestionId;
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
                !isCurrent &&
                  !isFlagged &&
                  isAnswered &&
                  'border-emerald-400 bg-emerald-50 text-emerald-700',
                !isCurrent &&
                  !isFlagged &&
                  !isAnswered &&
                  'border-border bg-muted text-muted-foreground',
              )}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
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
  const router = useRouter();
  const sectionsInExam = useMemo(
    () => TRYOUT_SECTIONS.filter((s) => questions.some((q) => q.section === s.value)),
    [questions],
  );

  const [sectionIndex, setSectionIndex] = useState(0);
  const [phase, setPhase] = useState<ExamPhase>('section-intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showNavigator, setShowNavigator] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  const activeSectionMeta = sectionsInExam[sectionIndex];
  const activeSection = activeSectionMeta?.value as TryoutSectionValue | undefined;

  const sectionQuestions = useMemo(
    () => (activeSection ? questions.filter((q) => q.section === activeSection) : []),
    [questions, activeSection],
  );

  const current = sectionQuestions[questionIndex];
  const examAudio = current ? resolveExamAudio(sectionQuestions, current) : null;
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 600;
  const isLastSection = sectionIndex >= sectionsInExam.length - 1;
  const sectionProgress = activeSection
    ? getTryoutSectionProgress(activeSection, questions, answers)
    : { answered: 0, total: 0 };

  const handleFinalSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    startTransition(async () => {
      const response = await submitTryoutAttempt({
        sessionCode,
        level: level as 'N5' | 'N4' | 'N3' | 'N2' | 'N1',
        answers: answersRef.current,
      });
      setSubmitting(false);
      if (!response.ok) {
        submittedRef.current = false;
        return;
      }
      router.push(STUDENT_ROUTES.tryoutResult(response.attemptId));
    });
  }, [sessionCode, level, router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          void handleFinalSubmit();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [handleFinalSubmit]);

  function startSection() {
    setQuestionIndex(0);
    setPhase('section-exam');
  }

  function confirmSectionComplete() {
    setShowSectionDialog(false);
    if (isLastSection) {
      void handleFinalSubmit();
      return;
    }
    setSectionIndex((i) => i + 1);
    setQuestionIndex(0);
    setPhase('section-intro');
  }

  if (!activeSectionMeta || !activeSection) {
    return null;
  }

  const shellProps = {
    sessionTitle,
    level,
    timeLeft,
    isUrgent,
    formatTime,
  };

  if (phase === 'section-intro') {
    return (
      <TryoutFocusShell {...shellProps}>
        <TryoutSectionIntro
          section={activeSection}
          questionCount={sectionQuestions.length}
          sectionIndex={sectionIndex}
          totalSections={sectionsInExam.length}
          onStart={startSection}
        />
      </TryoutFocusShell>
    );
  }

  if (!current || submitting || isPending) {
    return (
      <TryoutFocusShell {...shellProps}>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          {submitting || isPending ? 'Menyimpan hasil ujian…' : 'Memuat soal…'}
        </div>
      </TryoutFocusShell>
    );
  }

  const unansweredInSection = sectionProgress.total - sectionProgress.answered;

  return (
    <TryoutFocusShell {...shellProps}>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col rounded-2xl border border-border bg-muted/20">
        <div className="border-b border-border bg-card px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span
                className={cn(
                  'inline-block rounded-lg px-2.5 py-1 text-xs font-bold text-white',
                  SECTION_COLORS[current.section] ?? 'bg-muted-foreground',
                )}
              >
                {current.sectionLabel}
              </span>
              <p className="mt-1 text-xs text-muted-foreground">
                Soal {questionIndex + 1}/{sectionQuestions.length} · Bagian {sectionIndex + 1}/
                {sectionsInExam.length} · Total {answeredCount}/{questions.length} terjawab
              </p>
            </div>
            <Button size="sm" onClick={() => setShowSectionDialog(true)} disabled={isPending}>
              {isLastSection ? 'Selesai Tes' : 'Selesai Bagian'}
            </Button>
          </div>
          <div className="mt-2 h-1 bg-muted">
            <div
              className="h-1 bg-linear-to-r from-brand-red to-brand-yellow transition-all"
              style={{
                width: `${(sectionProgress.answered / Math.max(sectionProgress.total, 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-1">
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
              >
                {examAudio?.url ? (
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
                  <p
                    className="mb-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line"
                    style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                  >
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
                              selected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span
                            className="text-sm"
                            style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                          >
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
                      disabled={questionIndex === 0}
                      onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                    >
                      <ChevronLeft className="size-4" />
                      Sebelumnya
                    </Button>
                    <Button
                      disabled={questionIndex >= sectionQuestions.length - 1}
                      onClick={() =>
                        setQuestionIndex((i) => Math.min(sectionQuestions.length - 1, i + 1))
                      }
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
              Navigator — {current.sectionLabel}
            </h3>
            <SectionNavigator
              sectionQuestions={sectionQuestions}
              answers={answers}
              flagged={flagged}
              currentQuestionId={current.id}
              onGoTo={setQuestionIndex}
            />
          </aside>
        </div>

        <div className="sticky bottom-0 flex items-center gap-2 border-t border-border bg-card p-3 lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setShowNavigator(true)}>
            <Grid3x3 className="size-4" />
            Soal {questionIndex + 1}
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={questionIndex === 0}
            onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            size="icon"
            disabled={questionIndex >= sectionQuestions.length - 1}
            onClick={() =>
              setQuestionIndex((i) => Math.min(sectionQuestions.length - 1, i + 1))
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Dialog open={showNavigator} onOpenChange={setShowNavigator}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Navigator — {current.sectionLabel}</DialogTitle>
            </DialogHeader>
            <SectionNavigator
              sectionQuestions={sectionQuestions}
              answers={answers}
              flagged={flagged}
              currentQuestionId={current.id}
              onGoTo={(index) => {
                setQuestionIndex(index);
                setShowNavigator(false);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {isLastSection ? 'Akhiri Tes Sekarang?' : `Selesai Bagian ${current.sectionLabel}?`}
              </DialogTitle>
              <DialogDescription>
                {isLastSection ? (
                  <>
                    Kamu menjawab {answeredCount} dari {questions.length} soal total. Sisa waktu:{' '}
                    {formatTime(timeLeft)}. Soal kosong dianggap salah.
                  </>
                ) : (
                  <>
                    Bagian ini: {sectionProgress.answered}/{sectionProgress.total} terjawab.
                    {unansweredInSection > 0
                      ? ` ${unansweredInSection} soal belum diisi — akan dianggap kosong.`
                      : ''}{' '}
                    Kamu tidak bisa kembali ke bagian ini setelah lanjut.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
                Lanjutkan
              </Button>
              <Button onClick={confirmSectionComplete} disabled={isPending}>
                {isPending
                  ? 'Menyimpan…'
                  : isLastSection
                    ? 'Ya, Akhiri Tes'
                    : 'Lanjut ke Bagian Berikutnya'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TryoutFocusShell>
  );
}
