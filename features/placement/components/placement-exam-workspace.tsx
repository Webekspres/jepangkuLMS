'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { BarChart2, ChevronLeft, ChevronRight, Flag, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { submitPlacementAttempt } from '@/features/placement/actions/placement-actions';
import {
  PlacementChokaiNavigator,
  type ChokaiNavTarget,
} from '@/features/placement/components/placement-chokai-navigator';
import { PlacementChokaiContinuousAudio } from '@/features/placement/components/placement-chokai-continuous-audio';
import { PlacementFocusShell } from '@/features/placement/components/placement-focus-shell';
import { PlacementMondaiIntro } from '@/features/placement/components/placement-mondai-intro';
import { PlacementSectionIntro } from '@/features/placement/components/placement-section-intro';
import {
  CHOKAI_MONDAI_INSTRUCTIONS,
  CHOKAI_MONDAI_ORDER,
  type ChokaiMondaiKey,
} from '@/features/placement/data/chokai-mondai-instructions';
import {
  PLACEMENT_PAPER,
  PLACEMENT_SECTION_META,
} from '@/features/placement/data/placement-paper';
import type { PlacementQuestion, PlacementSectionCode } from '@/features/placement/data/types';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

const SECTION_ORDER: PlacementSectionCode[] = ['MOJI_GOI', 'BUNPOU_DOKKAI', 'CHOKAI'];

const SECTION_COLORS: Record<PlacementSectionCode, string> = {
  MOJI_GOI: 'bg-blue-500',
  BUNPOU_DOKKAI: 'bg-violet-500',
  CHOKAI: 'bg-emerald-500',
};

type ExamPhase = 'section-intro' | 'section-exam';
type ChokaiView = 'mondai-intro' | 'question';

function FlatSectionNavigator({
  sectionQuestions,
  answers,
  flagged,
  currentQuestionId,
  onGoTo,
}: {
  sectionQuestions: PlacementQuestion[];
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

function QuestionOptions({
  question,
  selectedId,
  onSelect,
}: {
  question: PlacementQuestion;
  selectedId: string | undefined;
  onSelect: (optionId: string) => void;
}) {
  return (
    <div
      className={cn(
        'grid gap-2 sm:gap-2.5',
        question.optionKind === 'IMAGE' && 'grid-cols-2',
        question.optionKind === 'NUMBER' && 'grid-cols-3',
      )}
    >
      {question.options.map((option, optIndex) => {
        const selected = selectedId === option.id;

        if (question.optionKind === 'IMAGE') {
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                'overflow-hidden rounded-xl border-2 bg-background text-left transition',
                selected
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/40',
              )}
            >
              <div className="relative aspect-4/3 bg-muted/50">
                {option.imageUrl ? (
                  <Image
                    src={option.imageUrl}
                    alt={`Opsi ${option.label}`}
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-3xl font-extrabold text-muted-foreground/40">
                    {option.label}
                  </span>
                )}
              </div>
              <div className="border-t border-border px-3 py-2 text-center text-sm font-bold">
                {option.label}
              </div>
            </button>
          );
        }

        if (question.optionKind === 'NUMBER') {
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                'flex aspect-square items-center justify-center rounded-2xl border-2 text-3xl font-extrabold transition sm:text-4xl',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-foreground hover:border-primary/50',
              )}
            >
              {option.label}
            </button>
          );
        }

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3',
              selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:size-8 sm:text-sm',
                selected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {String.fromCharCode(65 + optIndex)}
            </span>
            <span
              className="text-sm leading-snug"
              style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PlacementExamWorkspace() {
  const router = useRouter();
  const questions = PLACEMENT_PAPER.questions;

  const sectionsInExam = useMemo(
    () => SECTION_ORDER.filter((s) => questions.some((q) => q.section === s)),
    [questions],
  );

  const [sectionIndex, setSectionIndex] = useState(0);
  const [phase, setPhase] = useState<ExamPhase>('section-intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [showNavigator, setShowNavigator] = useState(false);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Choukai-only view state
  const [chokaiView, setChokaiView] = useState<ChokaiView>('mondai-intro');
  const [activeMondai, setActiveMondai] = useState<ChokaiMondaiKey>('CHOKAI_1');

  const advanceTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current != null) window.clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (advanceTimeoutRef.current != null) {
      window.clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, [questionIndex, activeMondai, chokaiView]);

  const activeSection = sectionsInExam[sectionIndex];
  const isChokaiSection = activeSection === 'CHOKAI';

  const sectionQuestions = useMemo(
    () => (activeSection ? questions.filter((q) => q.section === activeSection) : []),
    [questions, activeSection],
  );

  const questionsByMondai = useMemo(() => {
    const map = {} as Record<ChokaiMondaiKey, PlacementQuestion[]>;
    for (const key of CHOKAI_MONDAI_ORDER) {
      map[key] = sectionQuestions.filter((q) => q.mondai === key);
    }
    return map;
  }, [sectionQuestions]);

  const mondaiKeysWithQuestions = useMemo(
    () => CHOKAI_MONDAI_ORDER.filter((k) => (questionsByMondai[k]?.length ?? 0) > 0),
    [questionsByMondai],
  );

  const mondaiQuestions = useMemo(
    () => questionsByMondai[activeMondai] ?? [],
    [questionsByMondai, activeMondai],
  );
  const currentFlat = sectionQuestions[questionIndex];
  const currentChokai = mondaiQuestions[questionIndex];
  const current = isChokaiSection ? currentChokai : currentFlat;

  const isLastSection = sectionIndex >= sectionsInExam.length - 1;
  const answeredTotal = Object.keys(answers).length;

  const unansweredGlobal = useMemo(
    () => questions.filter((q) => !answers[q.id]),
    [answers, questions],
  );

  const answeredInFlatSection = sectionQuestions.filter((q) => answers[q.id]).length;
  const answeredInMondai = mondaiQuestions.filter((q) => answers[q.id]).length;

  function firstMondaiKey(): ChokaiMondaiKey {
    return mondaiKeysWithQuestions[0] ?? 'CHOKAI_1';
  }

  function startSection() {
    setQuestionIndex(0);
    setPhase('section-exam');
    if (activeSection === 'CHOKAI') {
      const first = firstMondaiKey();
      setActiveMondai(first);
      setChokaiView('mondai-intro');
    }
  }

  function startMondaiQuestions() {
    setChokaiView('question');
    setQuestionIndex(0);
  }

  function goToNextMondaiOrSubmit() {
    const idx = mondaiKeysWithQuestions.indexOf(activeMondai);
    if (idx >= 0 && idx < mondaiKeysWithQuestions.length - 1) {
      const next = mondaiKeysWithQuestions[idx + 1]!;
      setActiveMondai(next);
      setChokaiView('mondai-intro');
      setQuestionIndex(0);
      return;
    }
    if (isLastSection) {
      setShowSubmit(true);
    } else {
      setShowSectionDialog(true);
    }
  }

  const selectAnswer = useCallback(
    (optionId: string) => {
      const list = isChokaiSection ? mondaiQuestions : sectionQuestions;
      const question = list[questionIndex];
      if (!question) return;

      setAnswers((prev) => ({ ...prev, [question.id]: optionId }));

      const isLast = questionIndex >= list.length - 1;
      if (isLast) return;

      if (advanceTimeoutRef.current != null) {
        window.clearTimeout(advanceTimeoutRef.current);
      }
      advanceTimeoutRef.current = window.setTimeout(() => {
        advanceTimeoutRef.current = null;
        setQuestionIndex((i) => Math.min(list.length - 1, i + 1));
      }, 200);
    },
    [isChokaiSection, mondaiQuestions, sectionQuestions, questionIndex],
  );

  function handleChokaiNavigate(target: ChokaiNavTarget) {
    setActiveMondai(target.mondai);
    if (target.kind === 'intro') {
      setChokaiView('mondai-intro');
      setQuestionIndex(0);
    } else {
      setChokaiView('question');
      setQuestionIndex(target.questionIndex);
    }
    setShowNavigator(false);
  }

  function confirmSectionComplete() {
    setShowSectionDialog(false);
    if (isLastSection) {
      setShowSubmit(true);
      return;
    }
    setSectionIndex((i) => i + 1);
    setQuestionIndex(0);
    setPhase('section-intro');
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await submitPlacementAttempt(answers);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowSubmit(false);
      router.push(STUDENT_ROUTES.placementResult(result.attemptId));
    });
  }

  if (!activeSection) {
    return (
      <PlacementFocusShell title={PLACEMENT_PAPER.title}>
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Belum ada soal di paket ini.</p>
        </div>
      </PlacementFocusShell>
    );
  }

  if (phase === 'section-intro') {
    return (
      <PlacementFocusShell title={PLACEMENT_PAPER.title} subtitle="Petunjuk bagian">
        <PlacementSectionIntro
          section={activeSection}
          questionCount={sectionQuestions.length}
          sectionIndex={sectionIndex}
          totalSections={sectionsInExam.length}
          onStart={startSection}
        />
      </PlacementFocusShell>
    );
  }

  const isChokaiIntro = isChokaiSection && chokaiView === 'mondai-intro';
  const mondaiMeta = isChokaiSection ? CHOKAI_MONDAI_INSTRUCTIONS[activeMondai] : null;
  const listLength = isChokaiSection ? mondaiQuestions.length : sectionQuestions.length;

  // Question view needs a current item; mondai intro does not.
  if (!isChokaiIntro && !current) {
    return (
      <PlacementFocusShell title={PLACEMENT_PAPER.title}>
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
          Memuat soal…
        </div>
      </PlacementFocusShell>
    );
  }

  const sectionMeta = PLACEMENT_SECTION_META[isChokaiSection ? 'CHOKAI' : current!.section];
  const isLastQuestionInList = questionIndex >= listLength - 1;
  const answeredInScope = isChokaiSection ? answeredInMondai : answeredInFlatSection;
  const isLastMondai =
    mondaiKeysWithQuestions.indexOf(activeMondai) === mondaiKeysWithQuestions.length - 1;
  const sectionSubmitLabel = isChokaiSection
    ? isLastQuestionInList
      ? isLastMondai
        ? 'Kirim jawaban'
        : 'Lanjut Mondai'
      : 'Berikutnya'
    : isLastSection
      ? 'Kirim jawaban'
      : 'Selesai Bagian';

  function onPrimaryFooter() {
    if (isChokaiSection) {
      if (isLastQuestionInList) {
        goToNextMondaiOrSubmit();
      } else {
        setQuestionIndex((i) => Math.min(listLength - 1, i + 1));
      }
      return;
    }
    if (isLastQuestionInList) {
      if (isLastSection) setShowSubmit(true);
      else setShowSectionDialog(true);
    } else {
      setQuestionIndex((i) => Math.min(listLength - 1, i + 1));
    }
  }

  return (
    <PlacementFocusShell title={PLACEMENT_PAPER.title} subtitle="Mode ujian · fokus">
      <div className="flex min-h-[calc(100vh-7rem)] flex-col rounded-xl border border-border bg-muted/20 sm:min-h-[calc(100vh-8rem)] sm:rounded-2xl">
        <div className="border-b border-border bg-card px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  'inline-block rounded-md px-2 py-0.5 text-[10px] font-bold text-white sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs',
                  SECTION_COLORS[isChokaiSection ? 'CHOKAI' : current!.section],
                )}
              >
                {isChokaiSection && mondaiMeta
                  ? `CHOKAI · もんだい ${mondaiMeta.number}`
                  : sectionMeta.short.toUpperCase()}
              </span>
              <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                {isChokaiIntro ? (
                  <>
                    Intro mondai · Bagian {sectionIndex + 1}/{sectionsInExam.length}
                  </>
                ) : (
                  <>
                    <span className="sm:hidden">
                      Soal {questionIndex + 1}/{listLength} · Bagian {sectionIndex + 1}/
                      {sectionsInExam.length}
                    </span>
                    <span className="hidden sm:inline">
                      Soal {questionIndex + 1}/{listLength} · Bagian {sectionIndex + 1}/
                      {sectionsInExam.length} · Total {answeredTotal}/{questions.length} terjawab
                    </span>
                  </>
                )}
              </p>
            </div>
            {!isChokaiIntro ? (
              <Button
                size="sm"
                className="h-8 shrink-0 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
                onClick={() => {
                  if (isChokaiSection) {
                    if (isLastMondai) setShowSubmit(true);
                    else goToNextMondaiOrSubmit();
                  } else if (isLastSection) {
                    setShowSubmit(true);
                  } else {
                    setShowSectionDialog(true);
                  }
                }}
                disabled={pending}
              >
                {isChokaiSection
                  ? isLastMondai
                    ? 'Kirim jawaban'
                    : 'Lanjut Mondai'
                  : isLastSection
                    ? 'Kirim jawaban'
                    : 'Selesai Bagian'}
              </Button>
            ) : null}
          </div>
          {!isChokaiIntro ? (
            <div className="mt-2 h-1 bg-muted">
              <div
                className="h-1 bg-linear-to-r from-brand-red to-brand-yellow transition-all"
                style={{
                  width: `${(answeredInScope / Math.max(listLength, 1)) * 100}%`,
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-1">
          <main className="flex-1 p-3 pb-20 sm:p-6 sm:pb-6 lg:p-8">
            {/* Audio lives outside AnimatePresence so playback survives soal/intro swaps */}
            {isChokaiSection ? (
              <PlacementChokaiContinuousAudio
                audioUrl={PLACEMENT_PAPER.chokaiAudioUrl}
                className="mb-4"
              />
            ) : null}

            {isChokaiIntro && mondaiMeta ? (
              <PlacementMondaiIntro
                instruction={mondaiMeta}
                questionCount={listLength}
                onStart={startMondaiQuestions}
              />
            ) : current ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                >
                  <div className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-8">
                    {current.sceneImageUrl ? (
                      <div className="relative mb-4 overflow-hidden rounded-xl border border-border bg-muted/40">
                        <Image
                          src={current.sceneImageUrl}
                          alt="Gambar soal"
                          width={480}
                          height={320}
                          className="mx-auto h-auto w-full max-w-lg object-contain"
                          unoptimized
                        />
                      </div>
                    ) : null}

                    <p
                      className="mb-3 text-sm leading-relaxed whitespace-pre-line text-foreground sm:mb-4 sm:text-base"
                      style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                    >
                      {current.prompt}
                    </p>

                    <QuestionOptions
                      question={current}
                      selectedId={answers[current.id]}
                      onSelect={selectAnswer}
                    />

                    {current.mondai === 'CHOKAI_4' ? (
                      <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                        <p className="mb-2 text-center text-xs font-bold tracking-wide text-muted-foreground">
                          － メモ －
                        </p>
                        <textarea
                          className="min-h-20 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Catatan singkat (opsional, tidak dinilai)…"
                          aria-label="Memo"
                        />
                      </div>
                    ) : null}
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
                      <Button onClick={onPrimaryFooter} disabled={pending}>
                        {isLastQuestionInList ? (
                          sectionSubmitLabel
                        ) : (
                          <>
                            Berikutnya
                            <ChevronRight className="size-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : null}
          </main>

          <aside className="hidden w-72 shrink-0 border-l border-border bg-card p-5 lg:block">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
              <BarChart2 className="size-4 text-primary" />
              Navigator — {isChokaiSection ? 'CHOKAI' : sectionMeta.short.toUpperCase()}
            </h3>
            {isChokaiSection ? (
              <PlacementChokaiNavigator
                questionsByMondai={questionsByMondai}
                answers={answers}
                flagged={flagged}
                activeMondai={activeMondai}
                view={chokaiView}
                questionIndex={questionIndex}
                onNavigate={handleChokaiNavigate}
              />
            ) : current ? (
              <FlatSectionNavigator
                sectionQuestions={sectionQuestions}
                answers={answers}
                flagged={flagged}
                currentQuestionId={current.id}
                onGoTo={setQuestionIndex}
              />
            ) : null}
          </aside>
        </div>

        {isChokaiIntro ? (
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-border bg-card/95 px-3 py-2.5 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs"
              onClick={() => setShowNavigator(true)}
            >
              <Grid3x3 className="size-3.5" />
              Navigator
            </Button>
            <Button size="sm" className="h-9" onClick={startMondaiQuestions}>
              Mulai soal
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-2 border-t border-border bg-card/95 px-3 py-2.5 backdrop-blur-sm sm:static sm:backdrop-blur-none lg:hidden">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 px-2.5 text-xs"
              onClick={() => setShowNavigator(true)}
            >
              <Grid3x3 className="size-3.5" />
              Soal {questionIndex + 1}
            </Button>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                disabled={questionIndex === 0}
                onClick={() => setQuestionIndex((i) => Math.max(0, i - 1))}
                aria-label="Soal sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </Button>
              {isLastQuestionInList ? (
                <Button
                  size="sm"
                  className="h-9 px-3 text-xs font-semibold"
                  onClick={onPrimaryFooter}
                  disabled={pending}
                >
                  {sectionSubmitLabel}
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="size-9"
                  onClick={onPrimaryFooter}
                  aria-label="Berikutnya"
                >
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <Dialog open={showNavigator} onOpenChange={setShowNavigator}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Navigator — {isChokaiSection ? 'CHOKAI' : sectionMeta.short.toUpperCase()}
              </DialogTitle>
            </DialogHeader>
            {isChokaiSection ? (
              <PlacementChokaiNavigator
                questionsByMondai={questionsByMondai}
                answers={answers}
                flagged={flagged}
                activeMondai={activeMondai}
                view={chokaiView}
                questionIndex={questionIndex}
                onNavigate={handleChokaiNavigate}
              />
            ) : current ? (
              <FlatSectionNavigator
                sectionQuestions={sectionQuestions}
                answers={answers}
                flagged={flagged}
                currentQuestionId={current.id}
                onGoTo={(index) => {
                  setQuestionIndex(index);
                  setShowNavigator(false);
                }}
              />
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selesai bagian {sectionMeta.short}?</DialogTitle>
              <DialogDescription>
                {answeredInFlatSection < sectionQuestions.length
                  ? `Masih ada ${sectionQuestions.length - answeredInFlatSection} soal belum dijawab. Kamu tetap bisa lanjut.`
                  : 'Semua soal di bagian ini sudah dijawab. Lanjut ke bagian berikutnya.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setShowSectionDialog(false)}>
                Cek lagi
              </Button>
              <Button onClick={confirmSectionComplete}>Lanjut</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
          <SubmitDialog
            unanswered={unansweredGlobal.length}
            error={error}
            pending={pending}
            onClose={() => setShowSubmit(false)}
            onSubmit={handleSubmit}
          />
        </Dialog>
      </div>
    </PlacementFocusShell>
  );
}

function SubmitDialog({
  unanswered,
  error,
  pending,
  onClose,
  onSubmit,
}: {
  unanswered: number;
  error: string | null;
  pending: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Kirim jawaban?</DialogTitle>
        <DialogDescription>
          {unanswered === 0
            ? 'Semua soal sudah dijawab. Hasil akan merekomendasikan jalur N5 atau N4.'
            : `Masih ada ${unanswered} soal belum dijawab. Soal kosong dihitung salah.`}
        </DialogDescription>
      </DialogHeader>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <DialogFooter className="gap-3">
        <Button variant="outline" disabled={pending} onClick={onClose}>
          Cek lagi
        </Button>
        <Button disabled={pending} onClick={onSubmit}>
          {pending ? 'Mengirim…' : 'Kirim & lihat hasil'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
