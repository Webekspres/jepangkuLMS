'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Award, Coins, Mail, Trophy, User, Zap } from 'lucide-react';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStudentCoreData } from './student-core-data-context';
import { DisplayNameEditor } from './display-name-editor';
import { STUDENT_ROUTES } from './student-routes';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accentClass,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub?: string;
  accentClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={cn('mb-3 flex size-9 items-center justify-center rounded-xl', accentClass)}>
        <Icon className="size-5" />
      </div>
      <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub ? <p className="mt-1 text-xs font-medium text-primary">{sub}</p> : null}
    </div>
  );
}

export function StudentProfilPage() {
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();

  const displayName = core.displayName ?? identity?.displayName ?? 'Pengguna';
  const email = identity?.email ?? core.email;
  const avatarUrl = identity?.imageUrl ?? core.avatarUrl;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-linear-to-br from-primary/5 via-background to-brand-yellow/5 px-5 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={96}
                height={96}
                className="size-24 rounded-2xl border-2 border-primary/20 object-cover shadow-sm"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-4xl font-black text-primary">
                {initial}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{displayName}</h1>
              {email ? (
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                  <Mail className="size-4 shrink-0" />
                  {email}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {core.levelTitle ?? 'Pemula'} · Lv.{core.level}
                {core.lmsRank != null ? ` · Rank LMS #${core.lmsRank}` : ''}
              </p>
              <DisplayNameEditor currentName={displayName} />
              {core.userId ? (
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  ID: {core.userId}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Zap}
          label="Total XP"
          value={formatDisplayNumber(core.totalXp)}
          sub={core.coreConnected ? 'Dari Core' : 'Menunggu Core'}
          accentClass="text-primary bg-primary/10"
        />
        <StatCard
          icon={Coins}
          label="Poin LMS"
          value={formatDisplayNumber(core.lmsPoints)}
          sub="Leaderboard LMS"
          accentClass="text-amber-600 bg-amber-500/10"
        />
        <StatCard
          icon={Award}
          label="Badge"
          value={String(core.badgeCount)}
          sub={`dari ${core.badges.length} tersedia`}
          accentClass="text-emerald-600 bg-emerald-500/10"
        />
        <StatCard
          icon={Trophy}
          label="Rank LMS"
          value={core.lmsRank != null ? `#${core.lmsRank}` : '—'}
          sub={
            core.leaderboardTotal > 0
              ? `dari ${formatDisplayNumber(core.leaderboardTotal)} pelajar`
              : undefined
          }
          accentClass="text-violet-600 bg-violet-500/10"
        />
      </div>

      {core.recentBadges.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
            <Award className="size-5 text-primary" />
            Badge Terbaru
          </h2>
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

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="default">
          <Link href={STUDENT_ROUTES.achievements}>
            <Award className="size-4" />
            Lihat Pencapaian
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={STUDENT_ROUTES.leaderboard}>
            <Trophy className="size-4" />
            Leaderboard
          </Link>
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {core.coreConnected ? (
          <>
            <User className="mr-1 inline size-3" />
            Identitas dari Clerk · XP/level dari Core · poin & badge dari LMS
          </>
        ) : (
          'Menghubungkan ke Core Backend untuk memuat XP dan badge…'
        )}
      </p>
    </div>
  );
}
