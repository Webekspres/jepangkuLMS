'use client';

import { useMemo, useState, useTransition } from 'react';
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
  Loader2,
  Lock,
  Play,
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
  const [curriculumOpen, setCurriculumOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ContentTab>(initialTab);
  const [flashcardVisited, setFlashcardVisited] = useState(initialTab === 'flashcard');
  const [quizPassed, setQuizPassed] = useState(false);

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

  const activeTrackStyle = activeTrack?.badgeClass ?? 'bg-primary/10 text-primary';
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href={STUDENT_ROUTES.home} className="hover:text-primary">
          Dashboard
        </Link>
        <ChevronRight className="size-3.5" />
        <Link href={STUDENT_ROUTES.kursusDetail(course.slug)} className="hover:text-primary">
          {course.title}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{lesson.title}</span>
      </div>

      {currentTrack !== 'umum' && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TRACKS.map((track) => {
            const target = findTrackLesson(syllabus, track.match);
            const isActive = currentTrack === track.id;
            if (!target) return null;
            return (
              <Link
                key={track.id}
                href={STUDENT_ROUTES.belajar(course.slug, target.slug)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all',
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

      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="space-y-4 lg:col-span-1">
          <Card className="overflow-hidden py-0">
            <button
              type="button"
              onClick={() => setCurriculumOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-4 text-left font-semibold text-foreground hover:bg-muted/40"
            >
              <span className="flex items-center gap-2 text-sm">
                <BookOpen className="size-4 text-primary" />
                Kurikulum
                <span className="text-xs font-normal text-muted-foreground">
                  · {syllabusGroups.length} modul
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'size-4 text-muted-foreground transition-transform duration-300 ease-out',
                  curriculumOpen && 'rotate-180',
                )}
              />
            </button>
            <AnimatedCollapse open={curriculumOpen}>
              <div className="max-h-[min(70vh,32rem)] overflow-y-auto border-t border-border pb-2">
                {(() => {
                  let globalIndex = 0;
                  return syllabusGroups.map((group) => {
                    const isModuleOpen = expandedModuleIds.includes(group.module);
                    const moduleCompleted = group.lessons.every((item) => item.isCompleted);
                    const moduleHasCurrent = group.lessons.some((item) => item.slug === lesson.slug);

                    return (
                      <div key={group.module} className="border-b border-border/60 last:border-none">
                        <button
                          type="button"
                          onClick={() => toggleModule(group.module)}
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
                          {moduleCompleted && (
                            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
                          )}
                        </button>

                        <AnimatedCollapse open={isModuleOpen}>
                          <div>
                            {group.lessons.map((item) => {
                              globalIndex += 1;
                              const index = globalIndex;
                              const isCurrent = item.slug === lesson.slug;
                              return (
                                <Link
                                  key={item.id}
                                  href={STUDENT_ROUTES.belajar(course.slug, item.slug)}
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
                  });
                })()}
              </div>
            </AnimatedCollapse>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-brand-yellow" />
                <span className="text-sm font-bold text-foreground">XP pelajaran ini</span>
              </div>
              {xpTasks.map((task) => (
                <div key={task.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                onClick={handleComplete}
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
        </aside>

        <div className="space-y-5 lg:col-span-3">
          <div className="inline-flex gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            {(
              [
                { id: 'video', label: 'Video Lesson', icon: Play },
                { id: 'flashcard', label: 'Flashcard', icon: Layers },
                { id: 'quiz', label: 'Quiz', icon: HelpCircle },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50',
                )}
              >
                <tab.icon className="size-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'video' && (
            <div className="space-y-4">
              <LessonVideoPlayer
                videoUrl={videoUrl}
                title={lesson.title}
                isDemo={isDemoVideo}
              />

              <Card>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div>
                    <h2 className="text-lg font-bold text-foreground sm:text-xl">{lesson.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{course.title}</p>
                  </div>
                  {lesson.content && (
                    <p className="text-sm leading-relaxed text-muted-foreground">{lesson.content}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
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
            </div>
          )}

          {activeTab === 'flashcard' && (
            <Card>
              <CardContent className="p-5 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-foreground">Flashcard — {lesson.title}</h2>
                  <span className="text-xs text-muted-foreground">
                    {flashcards.length} kartu tersedia
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
            <Card>
              <CardContent className="p-5 sm:p-8">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-foreground">Quiz — {lesson.title}</h2>
                  <Badge className={cn('text-white', trackColorClass)}>{trackJp}</Badge>
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
      </div>
    </div>
  );
}
