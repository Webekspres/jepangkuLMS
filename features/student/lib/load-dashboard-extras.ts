import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { prisma } from '@/lib/prisma';
import type { JlptPathItem } from '@/features/student/components/dashboard-data';
import type { AchievementMilestone } from '@/features/student/components/student-achievements-data';
import { resolveTryoutQuestionDisplay } from '@/features/admin-cms/lib/tryout-sections';
import { loadDashboardJlptPath } from '@/features/student/lib/load-student-learning-data';

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

export type DashboardWeeklyXpDay = {
  day: string;
  xp: number;
};

export type DashboardLivePreviewItem = {
  id: string;
  title: string;
  time: string;
  sensei: string;
  live: boolean;
  href: string;
};

const MILESTONE_META: Record<
  JlptPathItem['level'],
  { label: string; icon: string; desc: string }
> = {
  N5: { label: 'Pemula', icon: '🌱', desc: 'Kuasai hiragana, katakana, dan kanji dasar N5' },
  N4: { label: 'Dasar', icon: '📚', desc: 'Tata bahasa menengah dan kosakata N4' },
  N3: { label: 'Menengah', icon: '🗺️', desc: 'Percakapan kompleks dan reading N3' },
  N2: { label: 'Lanjutan', icon: '🏔️', desc: 'Teks formal & akademik N2' },
  N1: { label: 'Mahir', icon: '👑', desc: 'Level tertinggi JLPT — N1' },
};

function formatLiveClassSchedule(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Hari ini, ${time} WIB`;
  if (isTomorrow) return `Besok, ${time} WIB`;

  const day = date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  return `${day}, ${time} WIB`;
}

export function mapJlptPathToMilestones(path: JlptPathItem[]): AchievementMilestone[] {
  return path.map((item) => {
    const meta = MILESTONE_META[item.level];
    return {
      level: item.level,
      label: meta.label,
      icon: meta.icon,
      status:
        item.status === 'done'
          ? 'completed'
          : item.status === 'active'
            ? 'active'
            : 'locked',
      date:
        item.status === 'done'
          ? 'Selesai'
          : item.status === 'active'
            ? 'Sedang belajar'
            : 'Terkunci',
      desc: meta.desc,
      xp: item.progress ?? 0,
      progress: item.status === 'active' ? item.progress : undefined,
    };
  });
}

export const loadDashboardWeeklyXp = cache(async function loadDashboardWeeklyXp(): Promise<
  DashboardWeeklyXpDay[]
> {
  const userId = await requireAuthUserId();
  const since = new Date();
  since.setDate(since.getDate() - 6);
  since.setHours(0, 0, 0, 0);

  const events = await prisma.lmsXpEvent.findMany({
    where: { userId, createdAt: { gte: since } },
    select: { xpGained: true, createdAt: true },
  });

  const days: DashboardWeeklyXpDay[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const xp = events
      .filter((event) => event.createdAt >= start && event.createdAt <= end)
      .reduce((sum, event) => sum + event.xpGained, 0);

    days.push({ day: DAY_LABELS[start.getDay()], xp });
  }

  return days;
});

export const loadDashboardLivePreview = cache(async function loadDashboardLivePreview(
  limit = 2,
): Promise<DashboardLivePreviewItem[]> {
  const now = new Date();
  const rows = await prisma.liveClass.findMany({
    where: { isPublished: true, scheduledAt: { gte: now } },
    orderBy: { scheduledAt: 'asc' },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    time: formatLiveClassSchedule(row.scheduledAt),
    sensei: row.senseiName,
    live: row.scheduledAt.getTime() - now.getTime() <= 60 * 60 * 1000,
    href: '/dashboard/live-class',
  }));
});

export const loadAchievementMilestones = cache(async function loadAchievementMilestones(): Promise<
  AchievementMilestone[]
> {
  const path = await loadDashboardJlptPath();
  return mapJlptPathToMilestones(path);
});

export type TryoutSessionView = {
  id: string;
  code: string;
  title: string;
  phaseLabel: string;
  description: string | null;
  scheduledAt: string | null;
  timeLimitMinutes: number;
  questionCount: number;
};

export const loadTryoutSessions = cache(async function loadTryoutSessions(): Promise<
  TryoutSessionView[]
> {
  const sessions = await prisma.tryoutSession.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { questions: true } },
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    code: session.code,
    title: session.title,
    phaseLabel: session.phaseLabel,
    description: session.description,
    scheduledAt: session.scheduledAt?.toISOString() ?? null,
    timeLimitMinutes: session.timeLimitMinutes,
    questionCount: session._count.questions,
  }));
});

export type TryoutExamQuestion = {
  id: string;
  sortOrder: number;
  section: string;
  sectionLabel: string;
  questionText: string;
  explanation: string | null;
  audioUrl: string | null;
  audioGroupId: string | null;
  options: { id: string; text: string }[];
};

const SECTION_LABELS: Record<string, string> = {
  MOJI_GOI: 'MOJI GOI',
  BUNPOU_DOKKAI: 'BUNPOU DOKKAI',
  CHOKAI: 'CHOKAI',
};

export async function loadTryoutExam(sessionCode: string, level: LevelJLPT) {
  const session = await prisma.tryoutSession.findUnique({
    where: { code: sessionCode, isActive: true },
  });

  if (!session) return null;

  const questions = await prisma.question.findMany({
    where: {
      type: 'TRYOUT',
      tryoutSessionId: session.id,
      tryoutLevel: level,
    },
    include: { options: { orderBy: { id: 'asc' } } },
    orderBy: { sortOrder: 'asc' },
  });

  if (questions.length === 0) return { session, questions: [], empty: true as const };

  return {
    session,
    empty: false as const,
    questions: questions.map((q) => {
      const display = resolveTryoutQuestionDisplay({
        questionText: q.questionText,
        audioUrl: q.audioUrl,
        audioGroupId: q.audioGroupId,
      });

      return {
        id: q.id,
        sortOrder: q.sortOrder,
        section: q.tryoutSection ?? 'MOJI_GOI',
        sectionLabel: SECTION_LABELS[q.tryoutSection ?? 'MOJI_GOI'] ?? q.tryoutSection ?? 'Soal',
        questionText: display.body,
        explanation: q.explanation,
        audioUrl: display.audioUrl,
        audioGroupId: display.audioGroupId,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
      };
    }),
  };
}

export type LiveClassView = {
  id: string;
  title: string;
  description: string;
  senseiName: string;
  senseiLevel: string | null;
  category: string;
  level: LevelJLPT;
  dateLabel: string;
  timeLabel: string;
  maxSlots: number;
  filledSlots: number;
  thumbUrl: string | null;
  meetingUrl: string | null;
  isFull: boolean;
};

export const loadPublishedLiveClasses = cache(async function loadPublishedLiveClasses(): Promise<
  LiveClassView[]
> {
  const rows = await prisma.liveClass.findMany({
    where: { isPublished: true },
    orderBy: { scheduledAt: 'asc' },
  });

  return rows.map((row) => {
    const end = row.endsAt ?? new Date(row.scheduledAt.getTime() + 90 * 60_000);
    const dateLabel = row.scheduledAt.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeLabel = `${row.scheduledAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      senseiName: row.senseiName,
      senseiLevel: row.senseiLevel,
      category: row.category,
      level: row.level,
      dateLabel,
      timeLabel,
      maxSlots: row.maxSlots,
      filledSlots: row.filledSlots,
      thumbUrl: row.thumbUrl,
      meetingUrl: row.meetingUrl,
      isFull: row.filledSlots >= row.maxSlots,
    };
  });
});
