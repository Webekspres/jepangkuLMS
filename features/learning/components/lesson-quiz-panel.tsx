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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { submitQuizAnswers } from '@/features/learning/actions/learning-actions';
import {
  selectCurrentQuestionId,
  useQuizStore,
} from '@/features/quiz-engine/store/useQuizStore';
import { shuffleArray } from '@/lib/shuffle';
import { cn } from '@/lib/utils';

export type LessonQuizQuestion = {
  id: string;
  questionText: string;
  explanation?: string | null;
  options: { id: string; text: string }[];
};

type LessonQuizPanelProps = {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  questions: LessonQuizQuestion[];
  onSubmitted?: (score: number) => void;
};

type QuizPhase = 'questions' | 'result';

export function LessonQuizPanel({
  lessonId,
  lessonSlug,
  questions,
  onSubmitted,
}: LessonQuizPanelProps) {
  const [phase, setPhase] = useState<QuizPhase>('questions');
  const [result, setResult] = useState<{ score: number; correct: number; total: number } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

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
    [lessonSlug, questions],
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

  function handleSubmit() {
    if (!allAnswered) return;
    startTransition(async () => {
      const payload = await submitQuizAnswers({ lessonId, answers });
      setResult(payload);
      setPhase('result');
      onSubmitted?.(payload.score);
    });
  }

  function handleRetry() {
    reset();
    startSession(lessonSlug, shuffleArray(questions.map((q) => q.id)));
    setPhase('questions');
    setResult(null);
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
          {questionIds.map((qId, i) => (
            <div
              key={qId}
              className="rounded-xl border border-border bg-muted/30 p-2 text-center text-xs"
            >
              Soal {i + 1}
            </div>
          ))}
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
        <Badge variant="secondary" className="gap-1">
          +50 XP per benar
        </Badge>
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
                  onClick={() => setAnswer(currentQuestion.id, option.id)}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={goPrevious}
          disabled={currentIndex === 0}
          className="gap-1.5"
        >
          <ChevronLeft className="size-4" />
          Sebelumnya
        </Button>

        <div className="flex flex-wrap justify-center gap-1.5">
          {questionIds.map((qId, index) => (
            <button
              key={qId}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'size-8 rounded-lg text-xs font-semibold transition-colors',
                index === currentIndex
                  ? 'bg-primary text-primary-foreground'
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
            onClick={handleSubmit}
            disabled={!allAnswered || isPending}
            className="gap-1.5"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Lihat hasil
          </Button>
        ) : (
          <Button type="button" onClick={goNext} disabled={!selectedOptionId} className="gap-1.5">
            Selanjutnya
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
