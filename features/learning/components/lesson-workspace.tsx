'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { LessonType } from '@prisma/client';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedCollapse } from '@/components/ui/animated-collapse';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { showReward } from '@/features/student/components/reward-notification/show-reward';
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
        lessonType: LessonType | null;
        resolvedLessonType: LessonType | null;
        isLegacy: boolean;
        legacyDetectedTypes: LessonType[];
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
type LessonView = ContentTab | 'text';

type SyllabusGroup = GroupedLesson<LessonNavItem>;

type LessonCurriculumListProps = {
    syllabusGroups: SyllabusGroup[];
    expandedModuleIds: string[];
    onToggleModule: (moduleId: string) => void;
    courseSlug: string;
    currentLessonSlug: string;
    onLessonSelect?: () => void;
};

function curriculumScrollStorageKey(courseSlug: string) {
    return `jepangku:curriculum-scroll:${courseSlug}`;
}

function readStoredCurriculumScroll(courseSlug: string): number {
    if (typeof window === 'undefined') return 0;
    try {
        const raw = window.sessionStorage.getItem(curriculumScrollStorageKey(courseSlug));
        const value = Number(raw);
        return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
        return 0;
    }
}

function writeStoredCurriculumScroll(courseSlug: string, scrollTop: number) {
    if (typeof window === 'undefined') return;
    try {
        window.sessionStorage.setItem(
            curriculumScrollStorageKey(courseSlug),
            String(Math.max(0, Math.round(scrollTop))),
        );
    } catch {
        // Ignore quota / private-mode failures.
    }
}

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

type LessonCompleteActionProps = {
    completed: boolean;
    isPending: boolean;
    allContentEngaged: boolean;
    onMarkComplete: () => void;
    variant?: 'sidebar' | 'mobile-bar';
};

function LessonCompleteAction({
    completed,
    isPending,
    allContentEngaged,
    onMarkComplete,
    variant = 'sidebar',
}: LessonCompleteActionProps) {
    const isMobileBar = variant === 'mobile-bar';

    if (completed) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 text-center font-semibold text-emerald-700',
                    isMobileBar ? 'h-10 px-3 text-xs sm:h-9' : 'px-3 py-2.5 text-xs',
                )}
            >
                <CheckCircle2 className="size-4 shrink-0" />
                {isMobileBar ? 'Selesai' : 'Pelajaran selesai'}
            </div>
        );
    }

    if (isMobileBar) {
        return (
            <Button
                type="button"
                size="sm"
                className="h-10 shrink-0 gap-1.5 px-3 text-xs sm:h-9 sm:text-sm"
                disabled={!allContentEngaged || isPending}
                onClick={onMarkComplete}
            >
                {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                ) : (
                    <CheckCircle2 className="size-3.5" />
                )}
                Tandai Selesai
            </Button>
        );
    }

    return (
        <div className="space-y-2">
            {!allContentEngaged && (
                <p className="text-center text-[11px] leading-snug text-muted-foreground">
                    Selesaikan materi pelajaran ini untuk menandai selesai.
                </p>
            )}
            <Button
                type="button"
                size="sm"
                className="w-full gap-1.5"
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
        </div>
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
    const [localSyllabus, setLocalSyllabus] = useState(syllabus);
    const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
    const [curriculumLessonSlug, setCurriculumLessonSlug] = useState(lesson.slug);
    const desktopCurriculumScrollRef = useRef<HTMLDivElement>(null);
    const mobileCurriculumScrollRef = useRef<HTMLDivElement>(null);
    const savedCurriculumScrollRef = useRef(0);
    const curriculumScrollCourseRef = useRef(course.slug);

    const saveCurriculumScroll = useCallback(() => {
        const el = desktopCurriculumScrollRef.current ?? mobileCurriculumScrollRef.current;
        if (el) savedCurriculumScrollRef.current = el.scrollTop;
        writeStoredCurriculumScroll(course.slug, savedCurriculumScrollRef.current);
    }, [course.slug]);

    const restoreCurriculumScroll = useCallback(() => {
        const apply = () => {
            const top = savedCurriculumScrollRef.current;
            for (const el of [desktopCurriculumScrollRef.current, mobileCurriculumScrollRef.current]) {
                if (el) el.scrollTop = top;
            }
        };
        // Apply immediately and again after accordion height settles.
        requestAnimationFrame(() => {
            apply();
            requestAnimationFrame(apply);
        });
        const t1 = window.setTimeout(apply, 50);
        const t2 = window.setTimeout(apply, 320);
        return () => {
            window.clearTimeout(t1);
            window.clearTimeout(t2);
        };
    }, []);

    useLayoutEffect(() => {
        if (curriculumScrollCourseRef.current !== course.slug) {
            curriculumScrollCourseRef.current = course.slug;
            savedCurriculumScrollRef.current = 0;
        }
        if (savedCurriculumScrollRef.current <= 0) {
            savedCurriculumScrollRef.current = readStoredCurriculumScroll(course.slug);
        }
        return restoreCurriculumScroll();
    }, [course.slug, lesson.slug, localSyllabus, completed, restoreCurriculumScroll]);

    useEffect(() => {
        const nodes = [desktopCurriculumScrollRef.current, mobileCurriculumScrollRef.current].filter(Boolean);
        const onScroll = (event: Event) => {
            const target = event.currentTarget as HTMLDivElement;
            savedCurriculumScrollRef.current = target.scrollTop;
            writeStoredCurriculumScroll(course.slug, target.scrollTop);
        };
        for (const node of nodes) {
            node?.addEventListener('scroll', onScroll, { passive: true });
        }
        return () => {
            for (const node of nodes) {
                node?.removeEventListener('scroll', onScroll);
            }
        };
    }, [course.slug, mobileCurriculumOpen]);

    const currentLessonIndex = localSyllabus.findIndex((item) => item.slug === lesson.slug);
    const prevLesson = currentLessonIndex > 0 ? localSyllabus[currentLessonIndex - 1] : null;
    const nextLesson =
        currentLessonIndex < localSyllabus.length - 1 ? localSyllabus[currentLessonIndex + 1] : null;

    const flashcards = useMemo(() => buildLessonFlashcards(materials), [materials]);

    // Content availability flags — drive both the tabs and the XP checklist.
    const hasVideo = lesson.hasVideo;
    const hasFlashcard = flashcards.length > 0;
    const hasQuiz = questions.length > 0;
    const hasText = Boolean(lesson.content?.trim());
    const isLegacyLesson = lesson.isLegacy;
    const migratedLessonType = !isLegacyLesson ? lesson.resolvedLessonType : null;

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

    const resolvedMigratedView: LessonView | null =
        migratedLessonType === 'VIDEO'
            ? 'video'
            : migratedLessonType === 'FLASHCARD'
                ? 'flashcard'
                : migratedLessonType === 'QUIZ'
                    ? 'quiz'
                    : migratedLessonType === 'TEXT'
                        ? 'text'
                        : null;
    const currentInitialView: LessonView | null = isLegacyLesson ? resolvedInitialTab : resolvedMigratedView;

    const [activeTab, setActiveTab] = useState<ContentTab | null>(
        isLegacyLesson ? resolvedInitialTab : null,
    );
    const [flashcardVisited, setFlashcardVisited] = useState(currentInitialView === 'flashcard');
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [contentViewed, setContentViewed] = useState(
        currentInitialView === 'video' || currentInitialView === 'text',
    );

    const syllabusGroups = useMemo(() => {
        if (modules && modules.length > 0) {
            return groupSyllabusWithDbModules(modules, localSyllabus);
        }
        return groupLessonsFlat(localSyllabus);
    }, [modules, localSyllabus]);

    const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>(() =>
        getDefaultExpandedModuleIds(
            modules && modules.length > 0
                ? groupSyllabusWithDbModules(modules, syllabus)
                : groupLessonsFlat(syllabus),
            lesson.slug,
        ),
    );

    // Reset lesson-scoped state when navigating to another lesson without a remount.
    if (curriculumLessonSlug !== lesson.slug) {
        setCurriculumLessonSlug(lesson.slug);
        setLocalSyllabus(syllabus);
        setCompleted(lesson.isCompleted);
        setActiveTab(isLegacyLesson ? resolvedInitialTab : null);
        setFlashcardVisited(currentInitialView === 'flashcard');
        setQuizCompleted(false);
        setContentViewed(currentInitialView === 'video' || currentInitialView === 'text');
        setExpandedModuleIds((prev) => {
            const nextDefaults = getDefaultExpandedModuleIds(
                modules && modules.length > 0
                    ? groupSyllabusWithDbModules(modules, syllabus)
                    : groupLessonsFlat(syllabus),
                lesson.slug,
            );
            return Array.from(new Set([...prev, ...nextDefaults]));
        });
        if (mobileCurriculumOpen) {
            setMobileCurriculumOpen(false);
        }
    }

    useEffect(() => {
        if (currentInitialView === 'flashcard') {
            startTransition(async () => {
                await recordFlashcardVisit(lesson.id);
            });
        }
    }, [currentInitialView, lesson.id, startTransition]);

    useEffect(() => {
        if (!mobileCurriculumOpen) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [mobileCurriculumOpen]);

    const toggleModule = (moduleId: string) => {
        setExpandedModuleIds((prev) =>
            prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
        );
    };

    // Gate flags — each content type that exists must be engaged before the
    // "Tandai Selesai" button is enabled. Completion itself is explicit (button click).
    const contentSectionDone = hasVideo || hasText ? completed || contentViewed : true;
    const flashcardSectionDone = hasFlashcard ? flashcardVisited : true;
    const quizSectionDone = hasQuiz ? quizCompleted : true;
    const hasAnyContent = hasVideo || hasText || hasFlashcard || hasQuiz;
    const allContentEngaged = isLegacyLesson
        ? hasAnyContent && contentSectionDone && flashcardSectionDone && quizSectionDone
        : migratedLessonType === 'FLASHCARD'
            ? flashcardSectionDone
            : migratedLessonType === 'QUIZ'
                ? quizSectionDone
                : migratedLessonType === 'VIDEO' || migratedLessonType === 'TEXT'
                    ? contentSectionDone
                    : hasAnyContent && contentSectionDone && flashcardSectionDone && quizSectionDone;

    function markLessonCompleteOptimistic() {
        setLocalSyllabus((prev) =>
            prev.map((item) =>
                item.slug === lesson.slug ? { ...item, isCompleted: true } : item,
            ),
        );
    }

    // Explicit mark-complete handler — only called when user clicks the button.
    function handleMarkComplete() {
        if (completed || isPending) return;
        startTransition(async () => {
            const result = await markLessonComplete(lesson.id, REWARDS.LESSON_COMPLETED.xp);
            if (result && 'success' in result) {
                setCompleted(true);
                markLessonCompleteOptimistic();
                showReward({
                    type: 'lesson-complete',
                    xp: result.xpReward ?? REWARDS.LESSON_COMPLETED.xp,
                    points: result.pointsReward ?? REWARDS.LESSON_COMPLETED.points,
                    title: 'Pelajaran Selesai! 🎉',
                    description: `Kamu berhasil menyelesaikan "${lesson.title}"`,
                });
                requestStudentCoreDataRefresh();
                saveCurriculumScroll();
                router.refresh();
            } else if (result && 'alreadyCompleted' in result && result.alreadyCompleted) {
                setCompleted(true);
                markLessonCompleteOptimistic();
                saveCurriculumScroll();
                router.refresh();
            }
        });
    }

    function handleAutoMarkCompleteAfterQuiz() {
        if (completed || isPending || migratedLessonType !== 'QUIZ') return;
        startTransition(async () => {
            const result = await markLessonComplete(lesson.id, REWARDS.LESSON_COMPLETED.xp, {
                awardReward: false,
            });
            if (result && 'success' in result) {
                setCompleted(true);
                markLessonCompleteOptimistic();
                requestStudentCoreDataRefresh();
                saveCurriculumScroll();
                router.refresh();
            } else if (result && 'alreadyCompleted' in result && result.alreadyCompleted) {
                setCompleted(true);
                markLessonCompleteOptimistic();
                saveCurriculumScroll();
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
                if (result && result.awarded && !completed) {
                    showReward({
                      type: 'flashcard-complete',
                      xp: result.xpReward ?? REWARDS.FLASHCARD_EXPLORED.xp,
                      points: result.pointsReward ?? REWARDS.FLASHCARD_EXPLORED.points,
                      title: 'Materi Dijelajahi!',
                      description: `Kamu menjelajahi flashcard "${lesson.title}"`,
                    });
                    requestStudentCoreDataRefresh();
                }
            });
        }
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
        isLegacyLesson && availableTabs.length > 0 ? (
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
            onLessonSelect={() => {
                saveCurriculumScroll();
                setMobileCurriculumOpen(false);
            }}
        />
    );

    return (
            <div className="space-y-3 pb-[calc(5.25rem+max(1.25rem,env(safe-area-inset-bottom,0px)+0.75rem))] sm:space-y-4 md:space-y-5 lg:pb-10">
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
                        {isLegacyLesson && lesson.legacyDetectedTypes.length > 1 ? (
                            <Badge variant="secondary" className="w-fit">
                                Legacy multi-content lesson
                            </Badge>
                        ) : null}
                        {isLegacyLesson && lesson.legacyDetectedTypes.length > 1 ? (
                            <Alert className="border-amber-200 bg-amber-50 text-amber-950">
                                <AlertTitle>Lesson ini masih format lama</AlertTitle>
                                <AlertDescription>
                                    Kontennya masih gabungan {lesson.legacyDetectedTypes.join(', ')}.
                                    Selama masa migrasi, tampilan tab lama tetap dipakai agar materi lama tetap
                                    bisa diakses.
                                </AlertDescription>
                            </Alert>
                        ) : null}
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
                    {(migratedLessonType === 'VIDEO' || (isLegacyLesson && hasVideo)) && (
                        <div className={cn('w-full', isLegacyLesson && activeTab !== 'video' && 'hidden')}>
                            <SecureLessonVideoPlayer
                                lessonId={lesson.id}
                                title={lesson.title}
                                isActive={!isLegacyLesson || activeTab === 'video'}
                            />
                        </div>
                    )}

                    {(migratedLessonType === 'FLASHCARD' || activeTab === 'flashcard') && (
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

                    {(migratedLessonType === 'QUIZ' || activeTab === 'quiz') && (
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
                                        questions={questions}
                                        suppressRewardToast={completed}
                                        onSubmitted={() => {
                                            setQuizCompleted(true);
                                            handleAutoMarkCompleteAfterQuiz();
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
                    {((isLegacyLesson && activeTab === firstAvailableTab) ||
                        migratedLessonType === 'VIDEO' ||
                        migratedLessonType === 'TEXT') && (
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
                                    {isLegacyLesson && (hasFlashcard || hasQuiz) && (
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
                        </div>
                    )}
                    {/* Lesson Navigation Bar (Prev / Next Lesson) */}
                    <div className="flex items-center justify-between border-y border-border/60 py-4 my-6 gap-4">
                        {prevLesson ? (
                            <Link
                                href={STUDENT_ROUTES.belajar(course.slug, prevLesson.slug)}
                                onClick={saveCurriculumScroll}
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
                                onClick={saveCurriculumScroll}
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
                    {((isLegacyLesson && activeTab === firstAvailableTab) ||
                        migratedLessonType === 'VIDEO' ||
                        migratedLessonType === 'TEXT') && (
                        <LessonQaSection
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                            initialComments={lessonComments}
                        />
                    )}
                </div>

                <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
                    <Card className="overflow-hidden py-0 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
                            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <BookOpen className="size-4 text-primary" />
                                Konten kursus
                            </span>
                            <span className="text-xs text-muted-foreground">{syllabusGroups.length} modul</span>
                        </div>
                        <div
                            ref={desktopCurriculumScrollRef}
                            className="max-h-[min(58vh,32rem)] overflow-y-auto pb-2"
                        >
                            {curriculumPanel}
                        </div>
                        <div className="border-t border-border bg-muted/25 px-4 py-3.5">
                            <LessonCompleteAction
                                completed={completed}
                                isPending={isPending}
                                allContentEngaged={allContentEngaged}
                                onMarkComplete={handleMarkComplete}
                                variant="sidebar"
                            />
                        </div>
                    </Card>
                </aside>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm lg:hidden">
                {!completed && !allContentEngaged && (
                    <p className="border-b border-border/60 bg-muted/30 px-4 py-1.5 text-center text-[10px] text-muted-foreground sm:text-[11px]">
                        Selesaikan materi untuk menandai pelajaran ini selesai
                    </p>
                )}
                <div className="px-4 pt-3 pb-safe-lg sm:px-6">
                    <div className="mx-auto flex max-w-2xl items-center gap-2.5 sm:gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-10 min-w-0 flex-1 text-[0.875rem] sm:h-9 sm:text-sm"
                            onClick={() => setMobileCurriculumOpen(true)}
                        >
                            <List className="size-4 shrink-0" />
                            <span className="truncate">Daftar materi</span>
                        </Button>
                        <LessonCompleteAction
                            completed={completed}
                            isPending={isPending}
                            allContentEngaged={allContentEngaged}
                            onMarkComplete={handleMarkComplete}
                            variant="mobile-bar"
                        />
                    </div>
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
                    <div className="absolute inset-x-0 bottom-0 flex max-h-[min(88dvh,640px)] flex-col rounded-t-2xl border border-border bg-card pb-safe-lg shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5 sm:py-3.5">
                            <div>
                                <p className="text-sm font-semibold text-foreground sm:text-base">Konten kursus</p>
                                <p className="text-xs text-muted-foreground sm:text-sm">
                                    {localSyllabus.length} pelajaran · {syllabusGroups.length} modul
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
                        <div
                            ref={mobileCurriculumScrollRef}
                            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4"
                        >
                            {curriculumPanel}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
