'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  BarChart2,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Lock,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { useStudentCoreData } from './student-core-data-context';
import {
  buildAchievementMilestones,
  BADGE_RARITY_FILTER_ORDER,
  BADGE_RARITY_ORDER,
  buildAchievementBadgeEmptyMessage,
  filterAchievementBadges,
  getAchievementSummary,
  getBadgeRarityCounts,
  getBadgeRarityStyle,
  getBadgeXpByRarity,
  resolveAchievementBadgeRarity,
  type AchievementBadge,
  type AchievementMilestone,
  type BadgeFilter,
  type BadgeRarity,
  type BadgeRarityFilter,
  type BadgeSort,
} from './student-achievements-data';
import { STUDENT_ROUTES } from './student-routes';
import { equipStudentBadge } from '@/features/student/actions/profile-actions';
import { STUDENT_CORE_DATA_REFRESH_EVENT } from '@/features/student/lib/student-core-data-events';

const FILTER_OPTIONS: { id: BadgeFilter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'unlocked', label: 'Diraih' },
  { id: 'locked', label: 'Terkunci' },
];

const RARITY_LABELS: Record<BadgeRarity, string> = {
  Common: 'Common',
  Rare: 'Rare',
  Epic: 'Epic',
  Legendary: 'Legendary',
};

function BadgeIcon({ badge, size = 'md' }: { badge: AchievementBadge; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass =
    size === 'lg' ? 'size-24 text-4xl' : size === 'md' ? 'size-14 text-2xl' : 'size-10 text-lg';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-2xl border bg-card shadow-sm',
        sizeClass,
        badge.unlocked ? 'border-border' : 'border-border/60 opacity-60 grayscale',
      )}
    >
      {badge.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={badge.imageUrl} alt="" className="size-full object-cover" />
      ) : (
        <span>{badge.icon}</span>
      )}
      {!badge.unlocked && (
        <Lock className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-muted p-0.5 text-muted-foreground" />
      )}
    </div>
  );
}

function BadgeCard({
  badge,
  onSelect,
}: {
  badge: AchievementBadge;
  onSelect: (badge: AchievementBadge) => void;
}) {
  const rarityLabel = resolveAchievementBadgeRarity(badge.rarity);
  const style = getBadgeRarityStyle(rarityLabel);

  return (
    <motion.button
      type="button"
      whileHover={badge.unlocked ? { y: -4, scale: 1.02 } : { scale: 1.01 }}
      whileTap={badge.unlocked ? { scale: 0.98 } : undefined}
      disabled={!badge.unlocked}
      onClick={() => badge.unlocked && onSelect(badge)}
      className={cn(
        'relative w-full rounded-2xl border p-3 text-center transition-colors',
        badge.unlocked ? style.card : 'border-border bg-muted/20 opacity-70',
        badge.unlocked && 'cursor-pointer hover:shadow-sm',
      )}
    >
      <span
        className={cn(
          'absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase',
          style.chip,
        )}
      >
        {rarityLabel}
      </span>
      <div className="mb-2 flex justify-center">
        <BadgeIcon badge={badge} />
      </div>
      <p className={cn('truncate text-xs font-bold', badge.unlocked ? style.label : 'text-muted-foreground')}>
        {badge.name}
      </p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">
        {badge.unlocked ? badge.date : badge.requirementText ?? 'Terkunci'}
      </p>
      {badge.unlocked && badge.xp > 0 && (
        <div className={cn('mt-2 inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5', style.chip)}>
          <Zap className="size-2.5" />
          <span className="text-[10px] font-bold">+{badge.xp}</span>
        </div>
      )}
    </motion.button>
  );
}

function MilestoneRow({ milestone, index }: { milestone: AchievementMilestone; index: number }) {
  const statusIcon =
    milestone.status === 'completed' ? (
      <CheckCircle2 className="size-4 text-emerald-600" />
    ) : milestone.status === 'active' ? (
      <motion.span
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="size-2 rounded-full bg-primary"
      />
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="relative flex gap-3 pb-6 last:pb-0"
    >
      <div
        className={cn(
          'relative z-10 flex size-11 shrink-0 items-center justify-center rounded-xl border text-lg shadow-sm',
          milestone.status === 'completed' && 'border-emerald-500/30 bg-emerald-500/10',
          milestone.status === 'active' && 'border-primary/30 bg-primary/10',
          milestone.status === 'locked' && 'border-border bg-muted/40 grayscale',
        )}
      >
        {milestone.status === 'locked' ? <Lock className="size-4 text-muted-foreground" /> : milestone.icon}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-lg px-2 py-0.5 text-[10px] font-black text-primary-foreground',
              milestone.status === 'completed' && 'bg-emerald-600',
              milestone.status === 'active' && 'bg-primary',
              milestone.status === 'locked' && 'bg-muted-foreground',
            )}
          >
            {milestone.level}
          </span>
          <span className="text-sm font-bold text-foreground">{milestone.label}</span>
          {statusIcon}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{milestone.desc}</p>
        <p
          className={cn(
            'mt-1 text-xs font-medium',
            milestone.status === 'active' && 'text-primary',
            milestone.status === 'completed' && 'text-emerald-600',
            milestone.status === 'locked' && 'text-muted-foreground',
          )}
        >
          {milestone.date}
        </p>
        {milestone.status === 'active' && milestone.progress != null && (
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-[10px]">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-bold text-primary">{milestone.progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow"
                initial={{ width: 0 }}
                animate={{ width: `${milestone.progress}%` }}
                transition={{ duration: 1.2 }}
              />
            </div>
          </div>
        )}
        {milestone.status === 'completed' && (
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            +{formatDisplayNumber(milestone.xp)} XP
          </p>
        )}
      </div>
    </motion.div>
  );
}

function BadgeRarityFilterBar({
  rarityFilter,
  rarityCounts,
  onChange,
}: {
  rarityFilter: BadgeRarityFilter;
  rarityCounts: ReturnType<typeof getBadgeRarityCounts>;
  onChange: (rarity: BadgeRarityFilter) => void;
}) {
  const options: { id: BadgeRarityFilter; label: string }[] = [
    { id: 'all', label: 'Semua' },
    ...BADGE_RARITY_FILTER_ORDER.map((rarity) => ({
      id: rarity,
      label: RARITY_LABELS[rarity],
    })),
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filter rarity badge"
    >
      <span className="text-xs font-semibold text-muted-foreground">Rarity:</span>
      {options.map((option) => {
        const count = rarityCounts[option.id];
        const isActive = rarityFilter === option.id;
        const isRarity = option.id !== 'all';
        const style = isRarity ? getBadgeRarityStyle(option.id) : null;

        return (
          <button
            key={option.id}
            type="button"
            disabled={count === 0}
            onClick={() => onChange(option.id)}
            aria-pressed={isActive}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
              count === 0 && 'cursor-not-allowed opacity-40',
              isActive
                ? isRarity && style
                  ? cn(style.legend, style.ring, 'ring-2 ring-offset-1 ring-offset-background shadow-sm')
                  : 'border-primary bg-primary text-primary-foreground'
                : isRarity && style
                  ? cn('border', style.legend, 'hover:brightness-95')
                  : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
            )}
          >
            {isRarity && style ? (
              <span className={cn('size-2 rounded-full', style.dot)} aria-hidden />
            ) : null}
            <span>{option.label}</span>
            <span
              className={cn(
                'rounded-md px-1.5 py-0.5 text-[10px] tabular-nums',
                isActive ? 'bg-background/20' : 'bg-background/60 text-muted-foreground',
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BadgeDetailModal({
  badge,
  onClose,
  onEquip,
  isEquipping,
}: {
  badge: AchievementBadge | null;
  onClose: () => void;
  onEquip: (badgeId: string) => void;
  isEquipping: boolean;
}) {
  if (!badge) return null;
  const rarityLabel = resolveAchievementBadgeRarity(badge.rarity);
  const style = getBadgeRarityStyle(rarityLabel);

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 16 }}
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-lg"
          >
            <motion.div
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-4 flex justify-center"
            >
              <BadgeIcon badge={badge} size="lg" />
            </motion.div>
            <span className={cn('inline-flex rounded-lg px-3 py-1 text-xs font-bold uppercase', style.chip)}>
              {rarityLabel}
            </span>
            <h3 className="mt-3 text-xl font-extrabold text-foreground">{badge.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {badge.desc || badge.requirementText}
            </p>
            {!badge.unlocked && badge.requirementText ? (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Syarat: {badge.requirementText}
              </p>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {badge.xp > 0 && (
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <Zap className="mx-auto mb-1 size-5 text-brand-yellow" />
                  <p className="font-bold text-foreground">+{badge.xp} XP</p>
                  <p className="text-xs text-muted-foreground">Hadiah XP</p>
                </div>
              )}
              <div className={cn('rounded-xl border border-border bg-muted/30 p-3', badge.xp <= 0 && 'col-span-2')}>
                <Calendar className="mx-auto mb-1 size-5 text-muted-foreground" />
                <p className="font-bold text-foreground">{badge.date}</p>
                <p className="text-xs text-muted-foreground">Diraih</p>
              </div>
            </div>
            {badge.unlocked ? (
              <div className="mt-4 flex flex-col gap-2">
                {!badge.isEquipped ? (
                  <Button
                    className="w-full"
                    disabled={isEquipping}
                    onClick={() => onEquip(badge.id)}
                  >
                    Pasang sebagai title
                  </Button>
                ) : (
                  <p className="text-center text-xs font-semibold text-primary">✓ Title aktif</p>
                )}
                <Button variant="outline" className="w-full" onClick={onClose}>
                  Tutup
                </Button>
              </div>
            ) : (
              <Button className="mt-5 w-full" onClick={onClose}>
                Keren!
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StudentAchievementsPage({
  milestones: milestonesProp,
}: {
  milestones?: AchievementMilestone[];
}) {
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const badges = core.badges;
  const summary = getAchievementSummary(badges);
  const milestones = milestonesProp ?? buildAchievementMilestones(core.totalXp);
  const displayName = core.displayName ?? identity?.displayName ?? 'Siswa JepangKu';
  const userInitial = displayName.charAt(0).toUpperCase();

  const [filter, setFilter] = useState<BadgeFilter>('all');
  const [rarityFilter, setRarityFilter] = useState<BadgeRarityFilter>('all');
  const [sort, setSort] = useState<BadgeSort>('default');
  const [selectedBadge, setSelectedBadge] = useState<AchievementBadge | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [isEquipping, startEquipTransition] = useTransition();

  const rarityCounts = useMemo(() => getBadgeRarityCounts(badges, filter), [badges, filter]);

  const effectiveRarityFilter: BadgeRarityFilter =
    rarityFilter !== 'all' && rarityCounts[rarityFilter] === 0 ? 'all' : rarityFilter;

  const filteredBadges = useMemo(
    () => filterAchievementBadges(badges, filter, effectiveRarityFilter, sort),
    [badges, filter, effectiveRarityFilter, sort],
  );

  const emptyMessage = useMemo(
    () => buildAchievementBadgeEmptyMessage(filter, effectiveRarityFilter),
    [filter, effectiveRarityFilter],
  );

  const handleStatusFilterChange = (nextFilter: BadgeFilter) => {
    setFilter(nextFilter);
    const counts = getBadgeRarityCounts(badges, nextFilter);
    if (rarityFilter !== 'all' && counts[rarityFilter] === 0) {
      setRarityFilter('all');
    }
  };

  const handleCelebrate = () => {
    setCelebrate(true);
    window.setTimeout(() => setCelebrate(false), 2800);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Hero profile */}
      <section
        className="relative overflow-hidden rounded-2xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1E1B57 0%, #1a2d5a 60%, #2a1b4e 100%)' }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-red/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-8 left-8 h-40 w-40 rounded-full bg-primary/20 blur-[60px]" />
        <div className="relative px-5 py-6 sm:px-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center">
            <div className="relative shrink-0 self-center md:self-auto">
              <div className="flex size-24 items-center justify-center rounded-2xl bg-white/15 text-4xl font-black text-white shadow-sm ring-2 ring-white/20">
                {userInitial}
              </div>
              <div className="absolute -right-2 -bottom-2 flex size-10 items-center justify-center rounded-xl border-2 border-brand-navy bg-brand-yellow text-sm font-black text-brand-navy shadow-sm">
                {core.level}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="mb-1 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                  Pencapaian Saya
                </h1>
                {core.levelTitle ? (
                  <span className="rounded-xl bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white">
                    {core.levelTitle}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-white/60">
                {displayName} · Lv.{core.level} · {summary.unlockedCount} dari {summary.totalCount}{' '}
                badge diraih
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { icon: '⚡', label: 'Total XP', value: formatDisplayNumber(core.totalXp) },
                  { icon: '🏆', label: 'Badge', value: `${summary.unlockedCount}/${summary.totalCount}` },
                  { icon: '💰', label: 'Poin', value: formatDisplayNumber(core.lmsPoints) },
                  {
                    icon: '🥇',
                    label: 'Rank',
                    value: core.lmsRank != null ? `#${core.lmsRank}` : '—',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-white/10 px-3 py-2.5 text-center backdrop-blur-sm"
                  >
                    <span className="text-base">{stat.icon}</span>
                    <p className="text-sm font-bold text-white">{stat.value}</p>
                    <p className="text-[10px] text-white/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <div className="relative size-24">
                <svg viewBox="0 0 96 96" className="size-24 -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/40" />
                  <motion.circle
                    cx="48"
                    cy="48"
                    r="40"
                    fill="none"
                    stroke="url(#achievementXpRing)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 40 * 0.25 }}
                    transition={{ duration: 1.5, delay: 0.2 }}
                  />
                  <defs>
                    <linearGradient id="achievementXpRing" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="var(--chart-4)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-white">Lv.{core.level}</span>
                  <span className="text-[10px] text-white/50">level</span>
                </div>
              </div>
              <p className="mt-1 text-xs text-white/50">
                {formatDisplayNumber(core.totalXp)} XP · {formatDisplayNumber(core.lmsPoints)} poin
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button variant="ghost" size="sm" className="gap-2 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white" onClick={handleCelebrate}>
              🎉 Rayakan!
            </Button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-brand-yellow/30 bg-brand-yellow/95 px-6 py-3 shadow-lg"
          >
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-foreground">Selamat! Terus belajar!</p>
              <p className="text-sm text-muted-foreground">
                Kamu sudah meraih {summary.unlockedCount} badge!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Badge collection */}
        <section className="space-y-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Award className="size-5 text-primary" />
              Koleksi Badge
              <span className="text-sm font-normal text-muted-foreground">
                ({summary.unlockedCount}/{summary.totalCount})
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleStatusFilterChange(option.id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    filter === option.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <BadgeRarityFilterBar
            rarityFilter={effectiveRarityFilter}
            rarityCounts={rarityCounts}
            onChange={setRarityFilter}
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as BadgeSort)}
              className="ml-auto rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none"
            >
              <option value="default">Urut: Default</option>
              <option value="rarity-desc">Rarity: Tertinggi</option>
              <option value="rarity-asc">Rarity: Terendah</option>
              <option value="xp-desc">XP: Terbanyak</option>
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            {filteredBadges.length} badge ditampilkan
            {effectiveRarityFilter !== 'all' ? ` · filter ${effectiveRarityFilter}` : ''}
            {filter !== 'all' ? ` · ${filter === 'unlocked' ? 'diraih' : 'terkunci'}` : ''}
          </p>

          <div className="flex flex-wrap gap-2">
            {BADGE_RARITY_FILTER_ORDER.map((r) => {
              const legendStyle = getBadgeRarityStyle(r);
              return (
              <div
                key={r}
                className={cn('flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold', legendStyle.legend)}
              >
                <span className={cn('size-2 rounded-full', legendStyle.dot)} />
                {r}
              </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {filteredBadges.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                {!core.coreConnected && badges.length === 0
                  ? 'Memuat badge…'
                  : emptyMessage}
              </p>
            ) : (
              filteredBadges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <BadgeCard badge={badge} onSelect={setSelectedBadge} />
              </motion.div>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
              <BarChart2 className="size-5 text-primary" />
              XP dari Badge
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {BADGE_RARITY_ORDER.map((rarity) => {
                const { count, xp } = getBadgeXpByRarity(badges, rarity);
                const style = getBadgeRarityStyle(rarity);
                return (
                  <div key={rarity} className={cn('rounded-xl border p-3 text-center', style.legend)}>
                    <p className={cn('text-xl font-black', style.label)}>{count}</p>
                    <p className="text-xs text-muted-foreground">{rarity}</p>
                    <p className={cn('mt-1 text-xs font-semibold', style.label)}>+{xp} XP</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Journey sidebar */}
        <aside className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Perjalanan Belajar</h2>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="relative pl-1">
              <div className="absolute top-6 bottom-6 left-5 w-px bg-border" />
              {milestones.map((milestone, index) => (
                <MilestoneRow key={milestone.level} milestone={milestone} index={index} />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {[
              {
                href: STUDENT_ROUTES.home,
                icon: BookOpen,
                label: 'Lanjutkan Belajar',
                sub: `Lv.${core.level} · ${formatDisplayNumber(core.totalXp)} XP`,
                accent: 'text-primary bg-primary/10',
              },
              {
                href: STUDENT_ROUTES.tryout,
                icon: Target,
                label: 'Try Out JLPT',
                sub: 'Latihan soal simulasi',
                accent: 'text-blue-700 bg-blue-500/10',
              },
              {
                href: STUDENT_ROUTES.leaderboard,
                icon: Users,
                label: 'Leaderboard Global',
                sub:
                  core.lmsRank != null
                    ? `Kamu #${core.lmsRank} dari ${formatDisplayNumber(core.leaderboardTotal)}+`
                    : 'Lihat peringkat global',
                accent: 'text-violet-700 bg-violet-500/10',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:bg-muted/30"
              >
                <div className={cn('flex size-10 items-center justify-center rounded-xl', item.accent)}>
                  <item.icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </aside>
      </div>

      <BadgeDetailModal
        badge={selectedBadge}
        isEquipping={isEquipping}
        onClose={() => setSelectedBadge(null)}
        onEquip={(badgeId) => {
          startEquipTransition(async () => {
            await equipStudentBadge(badgeId);
            window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
            setSelectedBadge(null);
          });
        }}
      />
    </div>
  );
}
