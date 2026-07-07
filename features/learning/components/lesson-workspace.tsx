'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    BookOpen,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Circle,
    HelpCircle,
    Layers,
    List,
    Loader2,
    Lock,
    Play,
    X,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedCollapse } from '@/components/ui/animated-collapse';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FlashcardDeck } from '@/features/learning/components/flashcard-deck';
import { SecureLessonVideoPlayer } from '@/features/learning/components/secure-lesson-video-player';
import {
    LessonQuizPanel,
    type LessonQuizQuestion,
} from '@/features/learning/components/lesson-quiz-panel';
import { buildLessonFlashcards } from '@/features/learning/lib/build-lesson-flashcards';
import { markLessonComplete, recordFlashcardVisit } from '@/features/learning/actions/learning-actions';
import { GAMIFICATION_REWARDS as REWARDS } from '@/features/student/lib/gamification-rewards';
import {
    getDefaultExpandedModuleIds,
    groupSyllabusWithDbModules,
    type GroupedLesson,
} from '@/features/learning/lib/n5-lesson-modules';
import { groupLessonsFlat, type ModuleRow } from '@/features/learning/lib/course-tree';
import type { LessonCommentView } from '@/features/learning/actions/lesson-qa-actions';
import { LessonQaSection } from './lesson-qa-section';
import type { LessonNavItem } from '@/features/learning/lib/queries';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { requestStudentCoreDataRefresh } from '@/features/student/lib/student-core-data-events';
import { cn } from '@/lib/utils';

type MaterialKanji = {
    huruf: string;
    furigana: string | null;
    romaji: string | null;
    arti: string;
    mnemonik?: string | null;
    strokeGifUrl?: string | null;
    category: { name: string } | null;
};

type MaterialKosakata = {
    kosakata: string;
    furigana: string | null;
    romaji: string | null;
    arti: string;
    contohKalimat: string | null;
    category: { name: string } | null;
};

type MaterialTataBahasa = {
    tataBahasa: string;
    arti: string;
    contohKalimat: string | null;
    category: { name: string } | null;
};

export type LessonWorkspaceProps = {
    course: { slug: string; title: string; level: string };
    lesson: {
        id: string;
        slug: string;
        title: string;
        content: string | null;
        hasVideo: boolean;
        isCompleted: boolean;
        quizCount: number;
    };
    syllabus: LessonNavItem[];
    modules?: ModuleRow[];
    materials: {
        kanjis: MaterialKanji[];
        kosakatas: MaterialKosakata[];
        tataBahasas: MaterialTataBahasa[];
    };
    questions: LessonQuizQuestion[];
    initialTab?: ContentTab;
    lessonComments?: LessonCommentView[];
};

type ContentTab = 'video' | 'flashcard' | 'quiz';

type SyllabusGroup = GroupedLesson<LessonNavItem>;

type LessonCurriculumListProps = {
    syllabusGroups: SyllabusGroup[];
    expandedModuleIds: string[];
    onToggleModule: (moduleId: string) => void;
    courseSlug: string;
    currentLessonSlug: string;
    onLessonSelect?: () => void;
};

function LessonCurriculumList({
    syllabusGroups,
    expandedModuleIds,
    onToggleModule,
    courseSlug,
    currentLessonSlug,
    onLessonSelect,
}: LessonCurriculumListProps) {
    const groupStartIndices = useMemo(() => {
        const starts: number[] = [];
        let total = 0;
        for (const group of syllabusGroups) {
            starts.push(total);
            total += group.lessons.length;
        }
        return starts;
    }, [syllabusGroups]);

    return (
        <>
            {syllabusGroups.map((group, groupIndex) => {
                const isModuleOpen = expandedModuleIds.includes(group.module);
                const moduleCompleted = group.lessons.every((item) => item.isCompleted);
                const moduleHasCurrent = group.lessons.some((item) => item.slug === currentLessonSlug);

                return (
                    <div key={group.module} className="border-b border-border/60 last:border-none">
                        <button
                            type="button"
                            onClick={() => onToggleModule(group.module)}
                            className={cn(
                                'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
                                moduleHasCurrent && 'bg-primary/5',
                            )}
                            aria-expanded={isModuleOpen}
                        >
                            <ChevronDown
                                className={cn(
                                    'size-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out',
                                    isModuleOpen && 'rotate-180',
                                )}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground">
                                    {group.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {group.lessons.length} pelajaran
                                    {moduleCompleted ? ' · selesai' : ''}
                                </p>
                            </div>
                            {moduleCompleted && <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />}
                        </button>

                        <AnimatedCollapse open={isModuleOpen}>
                            <div>
                                {group.lessons.map((item, lessonIndex) => {
                                    const index = groupStartIndices[groupIndex] + lessonIndex + 1;
                                    const isCurrent = item.slug === currentLessonSlug;
                                    return (
                                        <Link
                                            key={item.id}
                                            href={STUDENT_ROUTES.belajar(courseSlug, item.slug)}
                                            onClick={onLessonSelect}
                                            className={cn(
                                                'flex items-start gap-3 border-t border-border/40 px-4 py-3 transition-colors hover:bg-muted/30',
                                                isCurrent && 'bg-primary/5',
                                            )}
                                        >
                                            <span className="mt-0.5 shrink-0">
                                                {item.isCompleted ? (
                                                    <CheckCircle2 className="size-5 text-emerald-600" />
                                                ) : isCurrent ? (
                                                    <span className="flex size-7 items-center justify-center rounded-full border-2 border-primary bg-primary/10 text-xs font-bold text-primary">
                                                        {index}
                                                    </span>
                                                ) : (
                                                    <Circle className="size-5 text-muted-foreground" />
                                                )}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    className={cn(
                                                        'line-clamp-2 text-xs font-semibold leading-snug',
                                                        item.isCompleted ? 'text-muted-foreground' : 'text-foreground',
                                                    )}
                                                >
                                                    {item.title}
                                                </p>
                                            </div>
                                            {item.hasQuiz && (
                                                <Badge variant="outline" className="shrink-0 text-[10px]">
                                                    Quiz
                                                </Badge>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </AnimatedCollapse>
                    </div>
                );
            })}
        </>
    );
}

type LessonXpTask = { label: string; xp: number; done: boolean };

type LessonXpPanelProps = {
    xpTasks: LessonXpTask[];
    completed: boolean;
    isPending: boolean;
    allContentEngaged: boolean;
    onMarkComplete: () => void;
    compact?: boolean;
};

function LessonXpPanel({
    xpTasks,
    completed,
    isPending,
    allContentEngaged,
    onMarkComplete,
    compact = false,
}: LessonXpPanelProps) {
    return (
        <Card className={compact ? 'border-dashed shadow-none' : 'shadow-sm'}>
            <CardContent className={cn('space-y-3', compact ? 'p-3.5 sm:p-4' : 'p-4')}>
                <div className="flex items-center gap-2">
                    <Zap className="size-4 text-brand-yellow" />
                    <span
                        className={cn(
                            'font-bold text-foreground',
                            compact ? 'text-sm' : 'text-sm md:text-base',
                        )}
                    >
                        XP pelajaran ini
                    </span>
                </div>
                {xpTasks.map((task) => (
                    <div key={task.label} className="flex items-center justify-between gap-2">
                        <span
                            className={cn(
                                'flex items-center gap-1.5 text-muted-foreground',
                                compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-sm',
                            )}
                        >
                            {task.done ? (
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                            ) : (
                                <span className="size-3.5 rounded-full border border-border" />
                            )}
                            {task.label}
                        </span>
                        <span
                            className={cn(
                                'text-xs font-bold',
                                task.done ? 'text-emerald-600' : 'text-muted-foreground',
                            )}
                        >
                            +{task.xp} XP
                        </span>
                    </div>
                ))}
                {completed ? (
                    <div className="mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="size-4 shrink-0" />
                        Pelajaran selesai
                    </div>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        className="mt-2 w-full gap-1.5"
                        disabled={!allContentEngaged || isPending}
                        onClick={onMarkComplete}
                    >
                        {isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="size-3.5" />
                        )}
                        {isPending ? 'Menyimpan…' : 'Tandai Selesai'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

export function LessonWorkspace({
    course,
    lesson,
    syllabus,
    modules,
    materials,
    questions,
    initialTab = 'video',
    lessonComments = [],
}: LessonWorkspaceProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [completed, setCompleted] = useState(lesson.isCompleted);
    const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
    const [curriculumLessonSlug, setCurriculumLessonSlug] = useState(lesson.slug);

    const currentLessonIndex = syllabus.findIndex((item) => item.slug === lesson.slug);
    const prevLesson = currentLessonIndex > 0 ? syllabus[currentLessonIndex - 1] : null;
    const nextLesson = currentLessonIndex < syllabus.length - 1 ? syllabus[currentLessonIndex + 1] : null;

    const flashcards = useMemo(() => buildLessonFlashcards(materials), [materials]);

    // Content availability flags — drive both the tabs and the XP checklist.
    const hasVideo = lesson.hasVideo;
    const hasFlashcard = flashcards.length > 0;
    const hasQuiz = questions.length > 0;

    // Intelligent default: pick the first available tab (video → flashcard → quiz),
    // respecting the requested initialTab only when that content actually exists.
    const firstAvailableTab: ContentTab | null = hasVideo
        ? 'video'
        : hasFlashcard
            ? 'flashcard'
            : hasQuiz
                ? 'quiz'
                : null;

    const resolvedInitialTab: ContentTab | null =
        initialTab === 'video' && hasVideo
            ? 'video'
            : initialTab === 'flashcard' && hasFlashcard
                ? 'flashcard'
                : initialTab === 'quiz' && hasQuiz
                    ? 'quiz'
                    : firstAvailableTab;

    const [activeTab, setActiveTab] = useState<ContentTab | null>(resolvedInitialTab);
    const [flashcardVisited, setFlashcardVisited] = useState(resolvedInitialTab === 'flashcard');
    const [quizPassed, setQuizPassed] = useState(false);
    const [contentViewed, setContentViewed] = useState(resolvedInitialTab === firstAvailableTab);

    // Reset lesson-scoped state when navigating to another lesson without a remount.
    if (curriculumLessonSlug !== lesson.slug) {
        setCurriculumLessonSlug(lesson.slug);
        setCompleted(lesson.isCompleted);
        setActiveTab(resolvedInitialTab);
        setFlashcardVisited(resolvedInitialTab === 'flashcard');
        setQuizPassed(false);
        setContentViewed(resolvedInitialTab === firstAvailableTab);
        if (mobileCurriculumOpen) {
            setMobileCurriculumOpen(false);
        }
    }

    useEffect(() => {
        if (resolvedInitialTab === 'flashcard') {
            startTransition(async () => {
                await recordFlashcardVisit(lesson.id);
            });
        }
    }, [lesson.id, resolvedInitialTab, startTransition]);

    useEffect(() => {
        if (!mobileCurriculumOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileCurriculumOpen]);

    const syllabusGroups = useMemo(() => {
        if (modules && modules.length > 0) {
            return groupSyllabusWithDbModules(modules, syllabus);
        }
        return groupLessonsFlat(syllabus);
    }, [modules, syllabus]);

    const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>(() =>
        getDefaultExpandedModuleIds(syllabusGroups, lesson.slug),
    );

    const toggleModule = (moduleId: string) => {
        setExpandedModuleIds((prev) =>
            prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
        );
    };

    // Gate flags — each content type that exists must be engaged before the
    // "Tandai Selesai" button is enabled. Completion itself is explicit (button click).
    const contentSectionDone = hasVideo || lesson.content ? completed || contentViewed : true;
    const flashcardSectionDone = hasFlashcard ? flashcardVisited : true;
    const quizSectionDone = hasQuiz ? quizPassed : true;
    const hasAnyContent = hasVideo || Boolean(lesson.content) || hasFlashcard || hasQuiz;
    const allContentEngaged =
        hasAnyContent && contentSectionDone && flashcardSectionDone && quizSectionDone;

    // Explicit mark-complete handler — only called when user clicks the button.
    function handleMarkComplete() {
        if (completed || isPending) return;
        startTransition(async () => {
            const result = await markLessonComplete(lesson.id, REWARDS.LESSON_COMPLETED.xp);
            if (result && 'success' in result) {
                setCompleted(true);
                const event = new CustomEvent('gamified-event', {
                    detail: {
                        type: 'REWARD_EARNED',
                        payload: {
                            xpGained: result.xpReward ?? REWARDS.LESSON_COMPLETED.xp,
                            pointsGained: result.pointsReward ?? REWARDS.LESSON_COMPLETED.points,
                            title: 'Pelajaran Selesai! 🎉',
                            description: `Kamu berhasil menyelesaikan "${lesson.title}"`,
                        },
                    },
                });
                window.dispatchEvent(event);
                requestStudentCoreDataRefresh();
                router.refresh();
            } else if (result && 'alreadyCompleted' in result && result.alreadyCompleted) {
                setCompleted(true);
                router.refresh();
            }
        });
    }

    function handleTabChange(tab: ContentTab) {
        setActiveTab(tab);
        if (tab === 'video' || tab === firstAvailableTab) {
            setContentViewed(true);
        }
        if (tab === 'flashcard') {
            setFlashcardVisited(true);
            startTransition(async () => {
                const result = await recordFlashcardVisit(lesson.id);
                if (result && result.awarded) {
                    const event = new CustomEvent('gamified-event', {
                      detail: {
                        type: 'REWARD_EARNED',
                        payload: {
                          xpGained: result.xpReward ?? REWARDS.FLASHCARD_EXPLORED.xp,
                          pointsGained: result.pointsReward ?? REWARDS.FLASHCARD_EXPLORED.points,
                          title: 'Materi Dijelajahi!',
                          description: `Kamu menjelajahi flashcard "${lesson.title}"`,
                        },
                      },
                    });
                    window.dispatchEvent(event);
                    requestStudentCoreDataRefresh();
                }
                router.refresh();
            });
        }
    }

    // Only reward (and show) content that actually exists in this lesson.
    const xpTasks: LessonXpTask[] = [];
    if (hasVideo || lesson.content) {
        xpTasks.push({
            label: 'Video / materi dibaca',
            xp: REWARDS.LESSON_COMPLETED.xp,
            done: completed || contentViewed,
        });
    }
    if (hasFlashcard) {
        xpTasks.push({
            label: 'Flashcard dijelajahi',
            xp: REWARDS.FLASHCARD_EXPLORED.xp,
            done: flashcardVisited,
        });
    }
    if (hasQuiz) {
        xpTasks.push({
            label: 'Quiz lulus 70%+',
            xp: REWARDS.QUIZ_COMPLETED.xp,
            done: quizPassed,
        });
    }

    type TabDef = { id: ContentTab; label: string; icon: typeof Play };
    const availableTabs = (
        [
            hasVideo ? { id: 'video', label: 'Video', icon: Play } : null,
            hasFlashcard ? { id: 'flashcard', label: 'Flashcard', icon: Layers } : null,
            hasQuiz ? { id: 'quiz', label: 'Quiz', icon: HelpCircle } : null,
        ] as (TabDef | null)[]
    ).filter((tab): tab is TabDef => tab !== null);

    const tabColsClass =
        availableTabs.length >= 3
            ? 'grid-cols-3'
            : availableTabs.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-1';

    const contentTabs =
        availableTabs.length > 0 ? (
            <div
                className={cn(
                    'grid gap-1 rounded-xl border border-border bg-card p-1 shadow-sm sm:inline-flex sm:rounded-2xl sm:p-1.5',
                    tabColsClass,
                )}
            >
                {availableTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                            'inline-flex min-h-10 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-all sm:min-h-0 sm:justify-start sm:gap-1.5 sm:rounded-xl sm:px-4 sm:py-2 sm:text-sm',
                            activeTab === tab.id
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-muted/50',
                        )}
                    >
                        <tab.icon className="size-3.5 sm:size-4" />
                        <span className="truncate">{tab.label}</span>
                    </button>
                ))}
            </div>
        ) : null;

    const curriculumPanel = (
        <LessonCurriculumList
            syllabusGroups={syllabusGroups}
            expandedModuleIds={expandedModuleIds}
            onToggleModule={toggleModule}
            courseSlug={course.slug}
            currentLessonSlug={lesson.slug}
            onLessonSelect={() => setMobileCurriculumOpen(false)}
        />
    );

    return (
        <div className="space-y-3 pb-[calc(5.25rem+env(safe-area-inset-bottom,0))] sm:space-y-4 md:space-y-5 lg:pb-10">
            <nav
                aria-label="Breadcrumb"
                className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:gap-1.5 sm:text-sm"
            >
                <Link href={STUDENT_ROUTES.home} className="shrink-0 hover:text-primary">
                    Dashboard
                </Link>
                <ChevronRight className="size-3 shrink-0" aria-hidden />
                <Link
                    href={STUDENT_ROUTES.kursusDetail(course.slug)}
                    className="line-clamp-1 min-w-0 hover:text-primary"
                >
                    {course.title}
                </Link>
                <ChevronRight className="hidden size-3 shrink-0 lg:block" aria-hidden />
                <span className="hidden line-clamp-1 font-medium text-foreground lg:inline">
                    {lesson.title}
                </span>
            </nav>

            <div className="grid gap-4 sm:gap-5 md:gap-6 lg:grid-cols-[minmax(0,1fr)_min(100%,20rem)] xl:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-3 sm:space-y-4 md:space-y-5">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="lg:hidden">
                            <h1 className="text-base font-bold leading-snug text-foreground sm:text-lg md:text-xl">
                                {lesson.title}
                            </h1>
                            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{course.title}</p>
                        </div>
                        {contentTabs}
                    </div>

                    {lesson.slug === 'tryout-n5-placement' && (
                        <div className="rounded-2xl border-2 border-brand-yellow/30 bg-brand-yellow/10 p-4 sm:p-5 shadow-sm flex items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/20 text-brand-yellow text-lg font-bold">
                                📝
                            </span>
                            <div className="space-y-1">
                                <h3 className="text-sm font-bold text-foreground">Informasi Diagnostic Placement Test N5</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Ini adalah tes penempatan awal untuk mengukur pemahaman tata bahasa, kosakata, dan kanji dasar N5-mu. 
                                    Disarankan untuk menyelesaikan tes ini secara jujur tanpa melihat kamus atau catatan agar visualisasi hasil belajar di dashboard-mu akurat.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Priority 1 (TOP): Dynamic content area — active tab content ── */}
                    {hasVideo && (
                        <div className={cn('w-full', activeTab !== 'video' && 'hidden')}>
                            <SecureLessonVideoPlayer
                                lessonId={lesson.id}
                                title={lesson.title}
                                isActive={activeTab === 'video'}
                            />
                        </div>
                    )}

                    {activeTab === 'flashcard' && (
                        <Card className="border-border/80 shadow-sm">
                            <CardContent className="p-4 sm:p-6 md:p-8">
                                <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
                                    <h2 className="text-sm font-bold leading-snug text-foreground sm:text-base md:text-lg">
                                        Flashcard — {lesson.title}
                                    </h2>
                                    <span className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                                        {flashcards.length} kartu
                                    </span>
                                </div>
                                <FlashcardDeck items={flashcards} />
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'quiz' && (
                        <Card className="border-border/80 shadow-sm">
                            <CardContent className="p-4 sm:p-6 md:p-8">
                                <div className="mb-4 flex items-start justify-between gap-3 sm:mb-6">
                                    <h2 className="text-sm font-bold leading-snug text-foreground sm:text-base md:text-lg">
                                        Quiz — {lesson.title}
                                    </h2>
                                    <Badge variant="secondary" className="shrink-0 text-[10px] sm:text-xs">
                                        {questions.length} soal
                                    </Badge>
                                </div>
                                {hasQuiz ? (
                                    <LessonQuizPanel
                                        lessonId={lesson.id}
                                        lessonSlug={lesson.slug}
                                        lessonTitle={lesson.title}
                                        questions={questions}
                                        onSubmitted={(score) => {
                                            if (score >= 70) setQuizPassed(true);
                                        }}
                                    />
                                ) : (
                                    <div className="py-10 text-center">
                                        <Lock className="mx-auto mb-3 size-8 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            Belum ada soal quiz untuk pelajaran ini.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Priority 2 (MIDDLE): Lesson header & description ── */}
                    {activeTab === firstAvailableTab && (
                        <div className="space-y-3 sm:space-y-4">
                            <Card className="border-border/80 shadow-sm">
                                <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-5 md:p-6">
                                    <div className="hidden lg:block">
                                        <h2 className="text-xl font-bold text-foreground md:text-2xl">{lesson.title}</h2>
                                        <p className="mt-1 text-sm text-muted-foreground md:text-base">{course.title}</p>
                                    </div>
                                    {lesson.content && (
                                        <div className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] md:text-base">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {lesson.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                    {(hasFlashcard || hasQuiz) && (
                                        <div className="hidden flex-wrap gap-2 sm:flex">
                                            {hasFlashcard && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTabChange('flashcard')}
                                                >
                                                    <Layers className="size-4" />
                                                    Flashcard
                                                </Button>
                                            )}
                                            {hasQuiz && (
                                                <Button size="sm" onClick={() => handleTabChange('quiz')}>
                                                    <HelpCircle className="size-4" />
                                                    Mulai quiz ({questions.length})
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="lg:hidden">
                                <LessonXpPanel
                                    xpTasks={xpTasks}
                                    completed={completed}
                                    isPending={isPending}
                                    allContentEngaged={allContentEngaged}
                                    onMarkComplete={handleMarkComplete}
                                    compact
                                />
                            </div>
                        </div>
                    )}
                    {/* Lesson Navigation Bar (Prev / Next Lesson) */}
                    <div className="flex items-center justify-between border-y border-border/60 py-4 my-6 gap-4">
                        {prevLesson ? (
                            <Link
                                href={STUDENT_ROUTES.belajar(course.slug, prevLesson.slug)}
                                className="group flex flex-col items-start gap-1 max-w-[45%] text-left"
                            >
                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wide group-hover:text-primary transition-colors">
                                    <ChevronLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                                    Sebelumnya
                                </span>
                                <span className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {prevLesson.title}
                                </span>
                            </Link>
                        ) : (
                            <div className="invisible" />
                        )}

                        {nextLesson ? (
                            <Link
                                href={STUDENT_ROUTES.belajar(course.slug, nextLesson.slug)}
                                className="group flex flex-col items-end gap-1 max-w-[45%] text-right"
                            >
                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wide group-hover:text-primary transition-colors">
                                    Selanjutnya
                                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                                </span>
                                <span className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                    {nextLesson.title}
                                </span>
                            </Link>
                        ) : (
                            <div className="invisible" />
                        )}
                    </div>

                    {/* ── Priority 3 (BOTTOM): Q&A / discussion ── */}
                    {activeTab === firstAvailableTab && (
                        <LessonQaSection
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                            initialComments={lessonComments}
                        />
                    )}
                </div>

                <aside className="hidden space-y-4 lg:block lg:sticky lg:top-6 lg:self-start">
                    <Card className="overflow-hidden py-0">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <BookOpen className="size-4 text-primary" />
                                Konten kursus
                            </span>
                            <span className="text-xs text-muted-foreground">{syllabusGroups.length} modul</span>
                        </div>
                        <div className="max-h-[min(70vh,36rem)] overflow-y-auto pb-2">{curriculumPanel}</div>
                    </Card>

                    <LessonXpPanel
                        xpTasks={xpTasks}
                        completed={completed}
                        isPending={isPending}
                        allContentEngaged={allContentEngaged}
                        onMarkComplete={handleMarkComplete}
                    />
                </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm pb-[max(0.75rem,env(safe-area-inset-bottom,0))] sm:px-6 lg:hidden">
                <div className="mx-auto flex max-w-2xl items-center gap-2.5 sm:gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 min-w-0 flex-1 text-xs sm:h-9 sm:text-sm"
                        onClick={() => setMobileCurriculumOpen(true)}
                    >
                        <List className="size-4 shrink-0" />
                        <span className="truncate">Daftar materi</span>
                    </Button>
                    {completed ? (
                        <span className="flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 sm:h-9">
                            <CheckCircle2 className="size-4" />
                            Selesai
                        </span>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            className="h-10 shrink-0 gap-1.5 px-3 text-xs sm:h-9 sm:text-sm"
                            disabled={!allContentEngaged || isPending}
                            onClick={handleMarkComplete}
                        >
                            {isPending ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <CheckCircle2 className="size-3.5" />
                            )}
                            Tandai Selesai
                        </Button>
                    )}
                </div>
            </div>

            {mobileCurriculumOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Tutup daftar materi"
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setMobileCurriculumOpen(false)}
                    />
                    <div className="absolute inset-x-0 bottom-0 flex max-h-[min(88vh,640px)] flex-col rounded-t-2xl border border-border bg-card pb-[env(safe-area-inset-bottom,0)] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-3.5">
                            <div>
                                <p className="text-sm font-semibold text-foreground sm:text-base">Konten kursus</p>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    {syllabus.length} pelajaran · {syllabusGroups.length} modul
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Tutup"
                                onClick={() => setMobileCurriculumOpen(false)}
                            >
                                <X className="size-4" />
                            </Button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4">
                            {curriculumPanel}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
