'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  HelpCircle,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { submitQuizAnswers } from '@/features/learning/actions/learning-actions';
import {
  selectCurrentQuestionId,
  useQuizStore,
} from '@/features/quiz-engine/store/useQuizStore';
import { shuffleArray } from '@/lib/shuffle';
import { cn } from '@/lib/utils';
import { requestStudentCoreDataRefresh } from '@/features/student/lib/student-core-data-events';

export type LessonQuizQuestion = {
  id: string;
  questionText: string;
  explanation?: string | null;
  options: { id: string; text: string }[];
};

type LessonQuizPanelProps = {
  lessonId: string;
  lessonSlug: string;
  questions: LessonQuizQuestion[];
  onSubmitted?: (score: number) => void;
  /** Skip gamified toast when the lesson was already marked complete. */
  suppressRewardToast?: boolean;
};

type QuestionResultStatus = 'correct' | 'wrong' | 'unanswered';

function resultStatusClass(status: QuestionResultStatus) {
  switch (status) {
    case 'correct':
      return 'border-emerald-300 bg-emerald-500/15 text-emerald-800';
    case 'wrong':
      return 'border-destructive/40 bg-destructive/10 text-destructive';
    default:
      return 'border-border bg-muted/50 text-muted-foreground';
  }
}

type QuizPhase = 'questions' | 'result';

export function LessonQuizPanel({
  lessonId,
  lessonSlug,
  questions,
  onSubmitted,
  suppressRewardToast = false,
}: LessonQuizPanelProps) {
  const [phase, setPhase] = useState<QuizPhase>('questions');
  const [result, setResult] = useState<Awaited<ReturnType<typeof submitQuizAnswers>> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAdvancing, setIsAdvancing] = useState(false);

  const ADVANCE_DELAY_MS = 220;

  const {
    lessonSlug: storeSlug,
    questionIds,
    answers,
    currentIndex,
    startSession,
    setAnswer,
    goNext,
    goPrevious,
    setCurrentIndex,
    reset,
  } = useQuizStore();

  const shuffledQuestions = useMemo(
    () =>
      questions.map((q) => ({
        ...q,
        options: shuffleArray(q.options),
      })),
    [questions],
  );

  useEffect(() => {
    startSession(lessonSlug, shuffleArray(questions.map((q) => q.id)));
  }, [lessonSlug, questions, startSession]);

  const questionMap = useMemo(
    () => Object.fromEntries(shuffledQuestions.map((q) => [q.id, q])),
    [shuffledQuestions],
  );

  const currentQuestionId = useQuizStore(selectCurrentQuestionId);
  const currentQuestion = currentQuestionId
    ? questionMap[currentQuestionId]
    : shuffledQuestions[currentIndex];

  const progressPercent =
    questionIds.length === 0 ? 0 : Math.round(((currentIndex + 1) / questionIds.length) * 100);

  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;
  const allAnswered = questionIds.every((id) => Boolean(answers[id]));
  const isLast = currentIndex === questionIds.length - 1;

  function handleSubmit(answerOverride?: Record<string, string>) {
    const finalAnswers = answerOverride ?? answers;
    const ready = questionIds.every((id) => Boolean(finalAnswers[id]));
    if (!ready) return;

    startTransition(async () => {
      const payload = await submitQuizAnswers({ lessonId, answers: finalAnswers });
      setResult(payload);
      setPhase('result');

      if (!suppressRewardToast) {
        const event = new CustomEvent('gamified-event', {
          detail: {
            type: 'REWARD_EARNED',
            payload: {
              xpGained: payload.xpReward,
              pointsGained: payload.pointsReward,
              title: payload.score >= 70 ? 'Quiz Lulus! 🎉' : 'Quiz Selesai!',
              description: `Skor kamu: ${payload.score}% (${payload.correct}/${payload.total} benar)`,
            },
          },
        });
        window.dispatchEvent(event);
      }
      requestStudentCoreDataRefresh();

      onSubmitted?.(payload.score);
    });
  }

  function handleRetry() {
    reset();
    startSession(lessonSlug, shuffleArray(questions.map((q) => q.id)));
    setPhase('questions');
    setResult(null);
    setIsAdvancing(false);
  }

  function handleSelectOption(optionId: string) {
    if (!currentQuestion || isPending || isAdvancing) return;

    setAnswer(currentQuestion.id, optionId);

    const othersAnswered = questionIds.every(
      (id) => id === currentQuestion.id || Boolean(answers[id]),
    );

    if (isLast && othersAnswered) {
      const nextAnswers = { ...answers, [currentQuestion.id]: optionId };
      setIsAdvancing(true);
      window.setTimeout(() => {
        handleSubmit(nextAnswers);
        setIsAdvancing(false);
      }, ADVANCE_DELAY_MS);
      return;
    }

    if (!isLast) {
      setIsAdvancing(true);
      window.setTimeout(() => {
        goNext();
        setIsAdvancing(false);
      }, ADVANCE_DELAY_MS);
    }
  }

  if (questions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Belum ada soal quiz untuk pelajaran ini.
      </p>
    );
  }

  if (storeSlug !== lessonSlug || questionIds.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">Memuat soal…</div>
    );
  }

  if (phase === 'result' && result) {
    const passed = result.score >= 70;
    const resultByQuestionId = new Map(
      (result.questionResults ?? []).map((entry) => [entry.questionId, entry.status]),
    );

    return (
      <div className="mx-auto max-w-lg py-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'mx-auto mb-6 flex size-24 items-center justify-center rounded-3xl text-4xl shadow-lg',
            passed ? 'bg-emerald-500/15' : 'bg-primary/10',
          )}
        >
          {passed ? '🎉' : '💪'}
        </motion.div>
        <h3 className="text-xl font-extrabold text-foreground">
          {passed ? 'Bagus sekali!' : 'Terus berlatih!'}
        </h3>
        <p className="mt-2 text-muted-foreground">
          Skor:{' '}
          <span className="text-2xl font-bold tabular-nums text-primary">{result.score}%</span>
          <span className="text-sm">
            {' '}
            ({result.correct}/{result.total} benar)
          </span>
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {questionIds.map((qId, i) => {
            const status = (resultByQuestionId.get(qId) ?? 'unanswered') as QuestionResultStatus;
            return (
              <div
                key={qId}
                className={cn(
                  'rounded-xl border p-2 text-center text-xs font-semibold',
                  resultStatusClass(status),
                )}
              >
                Soal {i + 1}
              </div>
            );
          })}
        </div>
        <Button type="button" className="mt-6 gap-2" onClick={handleRetry}>
          <RotateCcw className="size-4" />
          Coba lagi
        </Button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          Soal {currentIndex + 1} dari {questionIds.length}
        </span>
      </div>

      <Progress
        value={progressPercent}
        className="h-2 [&>div]:bg-linear-to-r [&>div]:from-primary [&>div]:via-brand-orange [&>div]:to-brand-yellow"
      />

      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-start gap-2">
            <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-base leading-relaxed font-semibold whitespace-pre-line text-foreground">
              {currentQuestion.questionText}
            </p>
          </div>

          <div className="space-y-2.5">
            {currentQuestion.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const isSelected = selectedOptionId === option.id;
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelectOption(option.id)}
                  disabled={isPending || isAdvancing}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {letter}
                  </span>
                  <span className="text-sm leading-relaxed whitespace-pre-line text-foreground">
                    {option.text}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4">
        {/* Navigation buttons: always side-by-side */}
        <div className="flex items-center justify-between w-full gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={goPrevious}
            disabled={currentIndex === 0}
            className="gap-1.5 shrink-0"
          >
            <ChevronLeft className="size-4" />
            Sebelumnya
          </Button>

          {/* Question markers for large screen */}
          <div className="hidden md:flex flex-wrap justify-center gap-1.5 max-w-sm overflow-x-auto py-1">
            {questionIds.map((qId, index) => (
              <button
                key={qId}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'size-8 rounded-lg text-xs font-semibold transition-colors shrink-0',
                  index === currentIndex
                    ? 'bg-primary text-primary-foreground font-bold'
                    : answers[qId]
                      ? 'bg-emerald-500/15 text-emerald-700'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {isLast ? (
            <Button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!allAnswered || isPending || isAdvancing}
              className="gap-1.5 shrink-0"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Lihat hasil
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goNext}
              disabled={!selectedOptionId || isPending || isAdvancing}
              className="gap-1.5 shrink-0"
            >
              Selanjutnya
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>

        {/* Question markers for smaller screens: wrapped below buttons */}
        <div className="flex md:hidden flex-wrap justify-center gap-1.5 py-1">
          {questionIds.map((qId, index) => (
            <button
              key={qId}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'size-7 rounded-lg text-xs font-semibold transition-colors',
                index === currentIndex
                  ? 'bg-primary text-primary-foreground font-bold'
                  : answers[qId]
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
