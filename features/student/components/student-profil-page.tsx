'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  BarChart3,
  BookOpen,
  Coins,
  Pencil,
  Trophy,
  Zap,
} from 'lucide-react';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_ROUTES } from './student-routes';

function AvatarBlock({
  avatarUrl,
  initial,
  size = 'lg',
}: {
  avatarUrl?: string | null;
  initial: string;
  size?: 'lg' | 'xl';
}) {
  const dim = size === 'xl' ? 'size-24 sm:size-28' : 'size-20 sm:size-24';
  const textSize = size === 'xl' ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl';
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={112}
        height={112}
        className={cn(
          dim,
          'rounded-2xl border-3 border-white/30 object-cover shadow-lg ring-2 ring-white/20',
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        dim,
        'flex items-center justify-center rounded-2xl bg-primary/20 font-black text-white shadow-lg ring-2 ring-white/30',
        textSize,
      )}
    >
      {initial}
    </div>
  );
}

function StatBadge({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('mb-2 flex size-8 items-center justify-center rounded-lg text-white', accent)}>
        <Icon className="size-4" />
      </div>
      <p className="text-xl font-extrabold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  href,
  accent,
}: {
  icon: typeof BookOpen;
  label: string;
  href: string;
  accent?: string;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto flex-col gap-2 py-4 hover:border-primary/40 hover:bg-primary/5"
    >
      <Link href={href}>
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl',
            accent ?? 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="size-5" />
        </span>
        <span className="text-xs font-semibold">{label}</span>
      </Link>
    </Button>
  );
}

export function StudentProfilPage() {
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();

  const displayName = core.displayName ?? identity?.displayName ?? 'Pengguna';
  const email = identity?.email ?? core.email;
  const avatarUrl = identity?.imageUrl ?? core.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  const levelLabel = core.levelTitle ? `${core.levelTitle} · Lv.${core.level}` : `Level ${core.level}`;

  return (
    <div className="space-y-5 pb-8">
      {/* ── Hero banner ──────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1E1B57 0%, #1a2d5a 55%, #2a1b4e 100%)' }}
      >
        {/* Decorative radial glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-red/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-8 left-8 h-40 w-40 rounded-full bg-primary/20 blur-[60px]" />

        <div className="relative px-5 pt-6 pb-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: avatar + info */}
            <div className="flex gap-4 sm:gap-5">
              <AvatarBlock avatarUrl={avatarUrl} initial={initial} size="xl" />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                    PROFIL PELAJAR
                  </p>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {displayName}
                </h1>
                <p className="mt-0.5 text-sm text-white/60">{levelLabel}</p>
                {email && (
                  <p className="mt-1 text-xs font-mono text-white/40 truncate">{email}</p>
                )}
                {/* XP / points badge row */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-yellow/20 px-2.5 py-1 text-xs font-bold text-brand-yellow">
                    <Zap className="size-3" />
                    {formatDisplayNumber(core.totalXp)} XP
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                    <Coins className="size-3" />
                    {formatDisplayNumber(core.lmsPoints)} poin
                  </span>
                  {core.lmsRank != null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80">
                      <Trophy className="size-3" />
                      Rank #{core.lmsRank}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: edit button */}
            <Link href={`${STUDENT_ROUTES.profil}/edit`} className="shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Pencil className="size-3.5" />
                Edit Profil
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBadge
          icon={Zap}
          label="Total XP"
          value={formatDisplayNumber(core.totalXp)}
          accent="bg-primary"
        />
        <StatBadge
          icon={Coins}
          label="Poin LMS"
          value={formatDisplayNumber(core.lmsPoints)}
          accent="bg-amber-500"
        />
        <StatBadge
          icon={Award}
          label="Badge"
          value={String(core.badgeCount)}
          accent="bg-emerald-500"
        />
        <StatBadge
          icon={Trophy}
          label="Rank LMS"
          value={core.lmsRank != null ? `#${core.lmsRank}` : '—'}
          accent="bg-violet-500"
        />
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Aksi Cepat
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction
            icon={Award}
            label="Pencapaian"
            href={STUDENT_ROUTES.achievements}
            accent="bg-primary/10 text-primary"
          />
          <QuickAction
            icon={Trophy}
            label="Leaderboard"
            href={STUDENT_ROUTES.leaderboard}
            accent="bg-amber-500/10 text-amber-600"
          />
          <QuickAction
            icon={BookOpen}
            label="Kursus Saya"
            href={STUDENT_ROUTES.kursus}
            accent="bg-blue-500/10 text-blue-600"
          />
          <QuickAction
            icon={Pencil}
            label="Edit Profil"
            href={`${STUDENT_ROUTES.profil}/edit`}
            accent="bg-muted text-muted-foreground"
          />
        </div>
      </section>

      {/* ── Recent badges ──────────────────────────────────────────────────── */}
      {core.recentBadges.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Award className="size-4 text-primary" />
              Badge Terbaru
            </h2>
            <Link
              href={STUDENT_ROUTES.achievements}
              className="text-xs font-semibold text-primary hover:underline underline-offset-4"
            >
              Lihat semua →
            </Link>
          </div>
          <div className="flex flex-wrap gap-4">
            {core.recentBadges.map((badge) => (
              <div key={badge.unlockedAt + badge.title} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={badge.imageUrl}
                  alt={badge.title}
                  className="size-12 rounded-xl object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(badge.unlockedAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── XP Activity (mock) ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5 sm:px-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <BarChart3 className="size-4 text-primary" />
            Aktivitas XP Terbaru
          </h2>
          <Badge variant="secondary" className="text-[10px]">Segera tersedia</Badge>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: 'Menyelesaikan lesson Hiragana Vokal', xp: '+10 XP', time: 'Hari ini' },
            { label: 'Lulus quiz dengan skor 85%', xp: '+50 XP', time: 'Kemarin' },
            { label: 'Menjelajahi flashcard Katakana', xp: '+10 XP', time: '3 hari lalu' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 sm:px-6">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              <span className="shrink-0 text-sm font-bold text-primary">{item.xp}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-3 text-center sm:px-6">
          <p className="text-xs text-muted-foreground">
            Riwayat XP lengkap akan tersedia setelah integrasi Core selesai.
          </p>
        </div>
      </section>
    </div>
  );
}
