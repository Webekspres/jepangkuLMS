'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
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
import { LessonVideoPlayer } from '@/features/learning/components/lesson-video-player';
import {
  LessonQuizPanel,
  type LessonQuizQuestion,
} from '@/features/learning/components/lesson-quiz-panel';
import { markLessonComplete } from '@/features/learning/actions/learning-actions';
import {
  getDefaultExpandedModuleIds,
  groupLessonsByModule,
  type GroupedLesson,
} from '@/features/learning/lib/n5-lesson-modules';
import {
  resolveLessonVideoUrl,
} from '@/features/learning/lib/lesson-video';
import type { LessonNavItem } from '@/features/learning/lib/queries';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

type MaterialKanji = {
  huruf: string;
  furigana: string | null;
  romaji: string | null;
  arti: string;
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
    videoUrl: string | null;
    isCompleted: boolean;
    quizCount: number;
  };
  syllabus: LessonNavItem[];
  materials: {
    kanjis: MaterialKanji[];
    kosakatas: MaterialKosakata[];
    tataBahasas: MaterialTataBahasa[];
  };
  questions: LessonQuizQuestion[];
  initialTab?: ContentTab;
};

type MaterialTrack = 'kosakata' | 'tata-bahasa' | 'kanji' | 'umum';
type ContentTab = 'video' | 'flashcard' | 'quiz';

const TRACKS = [
  {
    id: 'kosakata' as const,
    label: 'Kosa Kata',
    jp: '語彙',
    match: 'kosakata',
    activeClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
    idleClass: 'border border-border bg-card text-muted-foreground hover:bg-muted/50',
    badgeClass: 'bg-blue-500/15 text-blue-700',
    trackColorClass: 'bg-blue-600',
    accentColor: '#2563eb',
  },
  {
    id: 'tata-bahasa' as const,
    label: 'Tata Bahasa',
    jp: '文法',
    match: 'tata-bahasa',
    activeClass: 'bg-violet-600 text-white shadow-md shadow-violet-600/25',
    idleClass: 'border border-border bg-card text-muted-foreground hover:bg-muted/50',
    badgeClass: 'bg-violet-500/15 text-violet-700',
    trackColorClass: 'bg-violet-600',
    accentColor: '#7c3aed',
  },
  {
    id: 'kanji' as const,
    label: 'Kanji',
    jp: '漢字',
    match: 'kanji',
    activeClass: 'bg-amber-600 text-white shadow-md shadow-amber-600/25',
    idleClass: 'border border-border bg-card text-muted-foreground hover:bg-muted/50',
    badgeClass: 'bg-amber-500/15 text-amber-700',
    trackColorClass: 'bg-amber-600',
    accentColor: '#d97706',
  },
];

function detectTrack(slug: string): MaterialTrack {
  if (slug.includes('kanji')) return 'kanji';
  if (slug.includes('kosakata')) return 'kosakata';
  if (slug.includes('tata-bahasa')) return 'tata-bahasa';
  return 'umum';
}

function findTrackLesson(syllabus: LessonNavItem[], match: string) {
  return syllabus.find((item) => item.slug.includes(match));
}

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

type LessonXpPanelProps = {
  xpTasks: { label: string; xp: string; done: boolean }[];
  completed: boolean;
  isPending: boolean;
  onComplete: () => void;
  compact?: boolean;
};

function LessonXpPanel({
  xpTasks,
  completed,
  isPending,
  onComplete,
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
              {task.xp}
            </span>
          </div>
        ))}
        <Button
          size="sm"
          className="mt-2 w-full"
          disabled={completed || isPending}
          onClick={onComplete}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : completed ? (
            'Pelajaran selesai'
          ) : (
            'Tandai selesai'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function LessonWorkspace({
  course,
  lesson,
  syllabus,
  materials,
  questions,
  initialTab = 'video',
}: LessonWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(lesson.isCompleted);
  const [mobileCurriculumOpen, setMobileCurriculumOpen] = useState(false);
  const [curriculumLessonSlug, setCurriculumLessonSlug] = useState(lesson.slug);
  const [activeTab, setActiveTab] = useState<ContentTab>(initialTab);
  const [flashcardVisited, setFlashcardVisited] = useState(initialTab === 'flashcard');
  const [quizPassed, setQuizPassed] = useState(false);

  if (curriculumLessonSlug !== lesson.slug) {
    setCurriculumLessonSlug(lesson.slug);
    if (mobileCurriculumOpen) {
      setMobileCurriculumOpen(false);
    }
  }

  useEffect(() => {
    if (!mobileCurriculumOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileCurriculumOpen]);

  const syllabusGroups = useMemo(() => groupLessonsByModule(syllabus), [syllabus]);

  const [expandedModuleIds, setExpandedModuleIds] = useState<string[]>(() =>
    getDefaultExpandedModuleIds(syllabusGroups, lesson.slug),
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModuleIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId],
    );
  };

  const currentTrack = detectTrack(lesson.slug);
  const activeTrack = TRACKS.find((t) => t.id === currentTrack);

  const flashcards = useMemo(() => {
    if (materials.kosakatas.length > 0) {
      return materials.kosakatas.map((item) => ({
        front: item.kosakata,
        sub: [item.furigana, item.romaji].filter(Boolean).join(' · ') || null,
        back: item.arti,
        example: item.contohKalimat,
      }));
    }
    if (materials.kanjis.length > 0) {
      return materials.kanjis.map((item) => ({
        front: item.huruf,
        sub: [item.furigana, item.romaji].filter(Boolean).join(' · ') || null,
        back: item.arti,
        example: null,
      }));
    }
    if (materials.tataBahasas.length > 0) {
      return materials.tataBahasas.map((item) => ({
        front: item.tataBahasa,
        sub: null,
        back: item.arti,
        example: item.contohKalimat,
      }));
    }
    return [];
  }, [materials]);

  const trackLabel =
    currentTrack === 'umum' ? 'Video Lesson' : (activeTrack?.label ?? lesson.title);
  const trackJp = activeTrack?.jp ?? '学習';
  const trackColorClass = activeTrack?.trackColorClass ?? 'bg-primary';
  const accentColor = activeTrack?.accentColor ?? '#ec1d24';

  function handleComplete() {
    startTransition(async () => {
      const result = await markLessonComplete(lesson.id);
      if ('success' in result || result.alreadyCompleted) {
        setCompleted(true);
        router.refresh();
      }
    });
  }

  function handleTabChange(tab: ContentTab) {
    setActiveTab(tab);
    if (tab === 'flashcard') setFlashcardVisited(true);
  }

  const xpTasks = [
    { label: 'Video / materi dibaca', xp: '+10 XP', done: completed || Boolean(lesson.content) },
    { label: 'Flashcard dijelajahi', xp: '+10 XP', done: flashcardVisited },
    { label: 'Quiz lulus 70%+', xp: '+50 XP', done: quizPassed },
  ];

  const hasQuiz = questions.length > 0;
  const { url: videoUrl, isDemo: isDemoVideo } = resolveLessonVideoUrl(lesson.videoUrl);

  const contentTabs = (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1 shadow-sm sm:inline-flex sm:rounded-2xl sm:p-1.5">
      {(
        [
          { id: 'video', label: 'Video', icon: Play },
          { id: 'flashcard', label: 'Flashcard', icon: Layers },
          { id: 'quiz', label: 'Quiz', icon: HelpCircle },
        ] as const
      ).map((tab) => (
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
  );

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

      {currentTrack !== 'umum' && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:px-0">
          {TRACKS.map((track) => {
            const target = findTrackLesson(syllabus, track.match);
            const isActive = currentTrack === track.id;
            if (!target) return null;
            return (
              <Link
                key={track.id}
                href={STUDENT_ROUTES.belajar(course.slug, target.slug)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-sm',
                  isActive ? track.activeClass : track.idleClass,
                )}
              >
                <span>{track.label}</span>
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                    isActive ? 'bg-white/20 text-white' : track.badgeClass,
                  )}
                >
                  {track.jp}
                </span>
              </Link>
            );
          })}
        </div>
      )}

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

          <div className={cn('w-full', activeTab !== 'video' && 'hidden')}>
            <LessonVideoPlayer
              videoUrl={videoUrl}
              title={lesson.title}
              isDemo={isDemoVideo}
              isActive={activeTab === 'video'}
            />
          </div>

          {activeTab === 'video' && (
            <div className="space-y-3 sm:space-y-4">
              <Card className="border-border/80 shadow-sm">
                <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-5 md:p-6">
                  <div className="hidden lg:block">
                    <h2 className="text-xl font-bold text-foreground md:text-2xl">{lesson.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground md:text-base">{course.title}</p>
                  </div>
                  {lesson.content && (
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem] md:text-base">
                      {lesson.content}
                    </p>
                  )}
                  <div className="hidden flex-wrap gap-2 sm:flex">
                    <Button variant="outline" size="sm" onClick={() => handleTabChange('flashcard')}>
                      <Layers className="size-4" />
                      Flashcard
                    </Button>
                    {hasQuiz && (
                      <Button size="sm" onClick={() => handleTabChange('quiz')}>
                        <HelpCircle className="size-4" />
                        Mulai quiz ({questions.length})
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="lg:hidden">
                <LessonXpPanel
                  xpTasks={xpTasks}
                  completed={completed}
                  isPending={isPending}
                  onComplete={handleComplete}
                  compact
                />
              </div>
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
                <FlashcardDeck
                  items={flashcards}
                  trackLabel={trackLabel}
                  trackColorClass={trackColorClass}
                  accentColor={accentColor}
                />
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
                  <Badge className={cn('shrink-0 text-[10px] text-white sm:text-xs', trackColorClass)}>
                    {trackJp}
                  </Badge>
                </div>
                {hasQuiz ? (
                  <LessonQuizPanel
                    lessonId={lesson.id}
                    lessonSlug={lesson.slug}
                    lessonTitle={lesson.title}
                    trackJp={trackJp}
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
            onComplete={handleComplete}
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
          <Button
            type="button"
            size="sm"
            className="h-10 shrink-0 px-3 text-xs sm:h-9 sm:px-4 sm:text-sm"
            disabled={completed || isPending}
            onClick={handleComplete}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : completed ? (
              'Selesai'
            ) : (
              <>
                <span className="sm:hidden">Tandai</span>
                <span className="hidden sm:inline">Tandai selesai</span>
              </>
            )}
          </Button>
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
