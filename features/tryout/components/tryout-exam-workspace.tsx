'use client';

import Link from 'next/link';
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
import {
    saveTryoutExamProgressState,
    type TryoutExamProgressState,
} from '@/features/tryout/actions/tryout-exam-progress-actions';
import { resolveTryoutAudioPlayKey } from '@/features/tryout/lib/chokai-audio';
import {
    ChokaiAudioPlayer,
    ChokaiImageOption,
    ChokaiStimulusImage,
} from '@/features/tryout/components/chokai-media';
import { TryoutFocusShell } from '@/features/tryout/components/tryout-focus-shell';
import { TryoutSectionIntro } from '@/features/tryout/components/tryout-section-intro';
import { TryoutSubmitLoading } from '@/features/tryout/components/tryout-submit-loading';
import type { TryoutExamQuestion } from '@/features/student/lib/load-dashboard-extras';
import { resolveMediaUrl } from '@/lib/media/image-src';
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
    examProgress: { id: string; state: TryoutExamProgressState };
};

type ExamPhase = 'section-intro' | 'section-exam';

function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function resolveExamAudio(current: TryoutExamQuestion): {
    url: string | null;
    playerKey: string;
    isGroup: boolean;
    startMs: number;
    endMs: number | null;
} {
    if (current.section !== 'CHOKAI') {
        return { url: null, playerKey: current.id, isGroup: false, startMs: 0, endMs: null };
    }

    if (current.stimulus) {
        return {
            url: current.stimulus.audioUrl,
            playerKey: `stimulus-${current.stimulus.id}`,
            isGroup: true,
            startMs: current.stimulus.audioStartMs,
            endMs: current.stimulus.audioEndMs,
        };
    }

    if (current.audioGroupId) {
        return {
            url: current.audioUrl,
            playerKey: `group-${current.audioGroupId}`,
            isGroup: true,
            startMs: 0,
            endMs: null,
        };
    }

    return {
        url: current.audioUrl,
        playerKey: current.id,
        isGroup: false,
        startMs: 0,
        endMs: null,
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
    examProgress,
}: TryoutExamWorkspaceProps) {
    const router = useRouter();
    const sectionsInExam = useMemo(
        () => TRYOUT_SECTIONS.filter((s) => questions.some((q) => q.section === s.value)),
        [questions],
    );

    const [sectionIndex, setSectionIndex] = useState(0);
    const [phase, setPhase] = useState<ExamPhase>('section-intro');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>(examProgress.state.answers);
    const [playedAudioKeys, setPlayedAudioKeys] = useState<string[]>(
        examProgress.state.playedAudioKeys,
    );
    const [flagged, setFlagged] = useState<Set<string>>(new Set());
    const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);
    const [showSectionDialog, setShowSectionDialog] = useState(false);
    const [showNavigator, setShowNavigator] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [submitting, setSubmitting] = useState(false);

    const answersRef = useRef(answers);
    const submittedRef = useRef(false);
    const advanceTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        return () => {
            if (advanceTimeoutRef.current != null) {
                window.clearTimeout(advanceTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (advanceTimeoutRef.current != null) {
            window.clearTimeout(advanceTimeoutRef.current);
            advanceTimeoutRef.current = null;
        }
    }, [questionIndex]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void saveTryoutExamProgressState(examProgress.id, {
                answers,
                playedAudioKeys,
            });
        }, 400);
        return () => window.clearTimeout(timer);
    }, [answers, playedAudioKeys, examProgress.id]);

    const activeSectionMeta = sectionsInExam[sectionIndex];
    const activeSection = activeSectionMeta?.value as TryoutSectionValue | undefined;

    const sectionQuestions = useMemo(
        () => (activeSection ? questions.filter((q) => q.section === activeSection) : []),
        [questions, activeSection],
    );

    const selectAnswer = useCallback(
        (optionId: string) => {
            const question = sectionQuestions[questionIndex];
            if (!question) return;

            setAnswers((prev) => ({ ...prev, [question.id]: optionId }));

            const isLast = questionIndex >= sectionQuestions.length - 1;
            if (isLast) return;

            if (advanceTimeoutRef.current != null) {
                window.clearTimeout(advanceTimeoutRef.current);
            }
            advanceTimeoutRef.current = window.setTimeout(() => {
                advanceTimeoutRef.current = null;
                setQuestionIndex((i) => Math.min(sectionQuestions.length - 1, i + 1));
            }, 200);
        },
        [questionIndex, sectionQuestions],
    );

    const current = sectionQuestions[questionIndex];
    const examAudio = current ? resolveExamAudio(current) : null;
    const chokaiPlayKey =
        current?.section === 'CHOKAI' && examAudio?.url
            ? resolveTryoutAudioPlayKey({
                questionId: current.id,
                stimulusId: current.stimulusId,
                audioGroupId: current.audioGroupId,
            })
            : null;
    const chokaiAudioPlayed = chokaiPlayKey ? playedAudioKeys.includes(chokaiPlayKey) : false;
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
                answers: answersRef.current,
            });
            setSubmitting(false);
            if (!response.ok) {
                submittedRef.current = false;
                return;
            }
            router.push(STUDENT_ROUTES.tryoutResult(response.attemptId));
        });
    }, [sessionCode, router]);

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

    const shellProps = {
        sessionTitle,
        level,
        timeLeft,
        isUrgent,
        formatTime,
    };

    if (sectionsInExam.length === 0) {
        return (
            <TryoutFocusShell
                sessionTitle={sessionTitle}
                level={level}
                timeLeft={timeLeft}
                isUrgent={isUrgent}
                formatTime={formatTime}
            >
                <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
                    <h2 className="text-lg font-bold text-foreground">Belum ada soal untuk ujian ini</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Bank soal level {level} belum lengkap. Admin mungkin masih menyiapkan salah satu bagian
                        (MOJI GOI, BUNPOU DOKKAI, atau CHOKAI).
                    </p>
                    <Button asChild className="mt-6">
                        <Link href={STUDENT_ROUTES.tryout}>Kembali ke Pilih Sesi</Link>
                    </Button>
                </div>
            </TryoutFocusShell>
        );
    }

    if (!activeSectionMeta || !activeSection) {
        return null;
    }

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

    if (submitting || isPending) {
        return (
            <TryoutFocusShell {...shellProps}>
                <TryoutSubmitLoading />
            </TryoutFocusShell>
        );
    }

    if (!current) {
        return (
            <TryoutFocusShell {...shellProps}>
                <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
                    Memuat soal…
                </div>
            </TryoutFocusShell>
        );
    }

    const unansweredInSection = sectionProgress.total - sectionProgress.answered;
    const isLastQuestionInSection = questionIndex >= sectionQuestions.length - 1;
    const sectionSubmitLabel = isLastSection ? 'Selesai Tes' : 'Selesai Bagian';

    return (
        <TryoutFocusShell {...shellProps}>
            <div className="flex min-h-[calc(100vh-7rem)] flex-col rounded-xl border border-border bg-muted/20 sm:min-h-[calc(100vh-8rem)] sm:rounded-2xl">
                <div className="border-b border-border bg-card px-3 py-2.5 sm:px-6 sm:py-3">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="min-w-0 flex-1">
                            <span
                                className={cn(
                                    'inline-block rounded-md px-2 py-0.5 text-[10px] font-bold text-white sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-xs',
                                    SECTION_COLORS[current.section] ?? 'bg-muted-foreground',
                                )}
                            >
                                {current.sectionLabel}
                            </span>
                            <p className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                                <span className="sm:hidden">
                                    Soal {questionIndex + 1}/{sectionQuestions.length} · Bagian {sectionIndex + 1}/
                                    {sectionsInExam.length}
                                </span>
                                <span className="hidden sm:inline">
                                    Soal {questionIndex + 1}/{sectionQuestions.length} · Bagian {sectionIndex + 1}/
                                    {sectionsInExam.length} · Total {answeredCount}/{questions.length} terjawab
                                </span>
                            </p>
                        </div>
                        <Button
                            size="sm"
                            className="h-8 shrink-0 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm"
                            onClick={() => setShowSectionDialog(true)}
                            disabled={isPending}
                        >
                            {sectionSubmitLabel}
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
                    <main className="flex-1 p-3 pb-20 sm:p-6 sm:pb-6 lg:p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={current.id}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                            >
                                {examAudio?.url && current.section === 'CHOKAI' ? (
                                    <ChokaiAudioPlayer
                                        audioUrl={examAudio.url}
                                        playKey={chokaiPlayKey!}
                                        progressId={examProgress.id}
                                        alreadyPlayed={chokaiAudioPlayed}
                                        startMs={examAudio.startMs}
                                        endMs={examAudio.endMs}
                                        label={
                                            examAudio.isGroup
                                                ? 'Putar audio (satu grup listening)'
                                                : 'Putar audio'
                                        }
                                        onPlayed={(key) =>
                                            setPlayedAudioKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
                                        }
                                    />
                                ) : null}

                                <div className="rounded-xl border border-border bg-card p-4 sm:rounded-2xl sm:p-8">
                                    {current.stimulus?.instructionText ? (
                                        <p className="mb-3 text-sm text-muted-foreground whitespace-pre-line">
                                            {current.stimulus.instructionText}
                                        </p>
                                    ) : null}
                                    {current.stimulus?.imageUrl ? (
                                        <ChokaiStimulusImage imageUrl={current.stimulus.imageUrl} />
                                    ) : current.imageUrl && resolveMediaUrl(current.imageUrl) ? (
                                        <ChokaiStimulusImage imageUrl={current.imageUrl} />
                                    ) : null}
                                    <p
                                        className="mb-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line sm:mb-4"
                                        style={{ fontFamily: 'var(--font-noto-sans-jp, sans-serif)' }}
                                    >
                                        {current.questionText}
                                    </p>
                                    <div
                                        className={cn(
                                            'grid gap-2 sm:gap-2.5',
                                            current.answerOptionKind === 'IMAGE' && 'grid-cols-2',
                                        )}
                                    >
                                        {current.answerOptionKind === 'IMAGE'
                                            ? current.options.map((option, index) => (
                                                <ChokaiImageOption
                                                    key={option.id}
                                                    optionId={option.id}
                                                    letter={String.fromCharCode(65 + index)}
                                                    imageUrl={option.imageUrl}
                                                    fallbackText={option.text}
                                                    selected={answers[current.id] === option.id}
                                                    questionId={current.id}
                                                    sessionCode={sessionCode}
                                                    level={level}
                                                    onSelect={() => selectAnswer(option.id)}
                                                />
                                            ))
                                            : current.options.map((option, index) => {
                                                const selected = answers[current.id] === option.id;
                                                return (
                                                    <button
                                                        key={option.id}
                                                        type="button"
                                                        onClick={() => selectAnswer(option.id)}
                                                        className={cn(
                                                            'flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all sm:gap-3 sm:rounded-xl sm:px-4 sm:py-3',
                                                            selected
                                                                ? 'border-primary bg-primary/5'
                                                                : 'border-border hover:border-primary/30',
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
                                                            {String.fromCharCode(65 + index)}
                                                        </span>
                                                        <span
                                                            className="text-sm leading-snug"
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
                                        {isLastQuestionInSection ? (
                                            <Button onClick={() => setShowSectionDialog(true)} disabled={isPending}>
                                                {sectionSubmitLabel}
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() =>
                                                    setQuestionIndex((i) => Math.min(sectionQuestions.length - 1, i + 1))
                                                }
                                            >
                                                Berikutnya
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        )}
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
                        {isLastQuestionInSection ? (
                            <Button
                                size="sm"
                                className="h-9 gap-1 px-3 text-xs font-semibold"
                                onClick={() => setShowSectionDialog(true)}
                                disabled={isPending}
                            >
                                {sectionSubmitLabel}
                            </Button>
                        ) : (
                            <Button
                                size="icon"
                                className="size-9"
                                onClick={() =>
                                    setQuestionIndex((i) => Math.min(sectionQuestions.length - 1, i + 1))
                                }
                                aria-label="Soal berikutnya"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        )}
                    </div>
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
                                {isLastSection
                                    ? 'Kirim semua jawaban?'
                                    : `Kunci bagian ${current.sectionLabel}?`}
                            </DialogTitle>
                            <DialogDescription asChild>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    {isLastSection ? (
                                        <>
                                            <p>
                                                Kamu sudah menjawab <strong>{answeredCount}</strong> dari{' '}
                                                <strong>{questions.length}</strong> soal. Sisa waktu:{' '}
                                                <strong>{formatTime(timeLeft)}</strong>.
                                            </p>
                                            <p>Soal yang kosong akan dianggap salah. Setelah dikirim, kamu akan melihat
                                                halaman analisa jawaban.</p>
                                        </>
                                    ) : (
                                        <>
                                            <p>
                                                Progress bagian ini: <strong>{sectionProgress.answered}</strong>/
                                                <strong>{sectionProgress.total}</strong> terjawab.
                                                {unansweredInSection > 0 ? (
                                                    <>
                                                        {' '}
                                                        Masih ada <strong>{unansweredInSection}</strong> soal kosong — akan
                                                        dihitung salah.
                                                    </>
                                                ) : null}
                                            </p>
                                            <p>
                                                Bagian <strong>{current.sectionLabel}</strong> akan dikunci. Kamu tidak bisa
                                                kembali mengubah jawaban setelah ini.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-2">
                            <Button
                                variant="outline"
                                className="w-full sm:w-auto"
                                onClick={() => setShowSectionDialog(false)}
                            >
                                {isLastSection ? 'Periksa Lagi' : 'Kembali ke Soal'}
                            </Button>
                            <Button
                                className="w-full sm:w-auto"
                                onClick={confirmSectionComplete}
                                disabled={isPending}
                            >
                                {isPending
                                    ? 'Memproses…'
                                    : isLastSection
                                        ? 'Ya, Kirim Jawaban'
                                        : 'Ya, Kunci & Lanjut'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TryoutFocusShell>
    );
}
