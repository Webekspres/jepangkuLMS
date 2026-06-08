import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { DASHBOARD_MOCK_USER } from './dashboard-data';

export type BadgeRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export type AchievementBadge = {
  id: number;
  icon: string;
  name: string;
  desc: string;
  xp: number;
  unlocked: boolean;
  date: string | null;
  rarity: BadgeRarity;
};

export type AchievementMilestone = {
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
  label: string;
  icon: string;
  status: 'completed' | 'active' | 'locked';
  date: string;
  desc: string;
  xp: number;
  progress?: number;
};

export const BADGE_RARITY_ORDER: BadgeRarity[] = ['Legendary', 'Epic', 'Rare', 'Common'];

export const BADGE_RARITY_STYLES: Record<
  BadgeRarity,
  { card: string; label: string; chip: string; dot: string; legend: string }
> = {
  Common: {
    card: 'bg-muted/40 border-border',
    label: 'text-muted-foreground',
    chip: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
    legend: 'bg-muted/50 border-border text-muted-foreground',
  },
  Rare: {
    card: 'bg-blue-500/10 border-blue-500/25',
    label: 'text-blue-700',
    chip: 'bg-blue-500/15 text-blue-700',
    dot: 'bg-blue-500',
    legend: 'bg-blue-500/10 border-blue-500/25 text-blue-700',
  },
  Epic: {
    card: 'bg-violet-500/10 border-violet-500/25',
    label: 'text-violet-700',
    chip: 'bg-violet-500/15 text-violet-700',
    dot: 'bg-violet-500',
    legend: 'bg-violet-500/10 border-violet-500/25 text-violet-700',
  },
  Legendary: {
    card: 'bg-brand-yellow/10 border-brand-yellow/30',
    label: 'text-amber-700',
    chip: 'bg-brand-yellow/20 text-amber-700',
    dot: 'bg-brand-yellow',
    legend: 'bg-brand-yellow/10 border-brand-yellow/25 text-amber-700',
  },
};

export const ACHIEVEMENT_BADGES: AchievementBadge[] = [
  { id: 1, icon: '🌸', name: 'Sakura Pemula', desc: 'Selesaikan kursus N5 pertamamu', xp: 100, unlocked: true, date: 'Jan 2026', rarity: 'Common' },
  { id: 2, icon: '⚡', name: 'Kilat Belajar', desc: 'Belajar 7 hari berturut-turut', xp: 200, unlocked: true, date: 'Feb 2026', rarity: 'Rare' },
  { id: 3, icon: '📖', name: 'Kutu Buku', desc: 'Baca 50 teks bahasa Jepang', xp: 150, unlocked: true, date: 'Feb 2026', rarity: 'Common' },
  { id: 4, icon: '🎯', name: 'Tepat Sasaran', desc: 'Skor 90%+ di Try Out N5', xp: 300, unlocked: true, date: 'Mar 2026', rarity: 'Epic' },
  { id: 5, icon: '🔥', name: 'Pejuang Api', desc: 'Streak 14 hari berturut-turut', xp: 350, unlocked: true, date: 'Mar 2026', rarity: 'Rare' },
  { id: 6, icon: '🏆', name: 'Juara Kelas', desc: 'Masuk Top 10 leaderboard', xp: 500, unlocked: true, date: 'Apr 2026', rarity: 'Epic' },
  { id: 7, icon: '🎌', name: 'Nihon Daisuki', desc: 'Tonton 100 video pelajaran', xp: 250, unlocked: true, date: 'Apr 2026', rarity: 'Common' },
  { id: 8, icon: '🌙', name: 'Night Learner', desc: 'Belajar di atas pukul 22.00 selama 5 hari', xp: 150, unlocked: true, date: 'Apr 2026', rarity: 'Rare' },
  { id: 9, icon: '💎', name: 'Diamond Kanji', desc: 'Hafalkan 300 kanji N4', xp: 400, unlocked: true, date: 'Mei 2026', rarity: 'Epic' },
  { id: 10, icon: '🗾', name: 'Samurai N4', desc: 'Lulus simulasi JLPT N4', xp: 600, unlocked: false, date: null, rarity: 'Legendary' },
  { id: 11, icon: '⛩️', name: 'Torii Master', desc: 'Selesaikan 5 Live Class', xp: 200, unlocked: false, date: null, rarity: 'Rare' },
  { id: 12, icon: '🎎', name: 'Nihongo Sensei', desc: 'Bantu 10 sesama pelajar di forum', xp: 300, unlocked: false, date: null, rarity: 'Epic' },
  { id: 13, icon: '🌊', name: 'Ombak Hiragana', desc: 'Kuasai semua hiragana 100%', xp: 150, unlocked: true, date: 'Jan 2026', rarity: 'Common' },
  { id: 14, icon: '⭐', name: 'Bintang Katakana', desc: 'Kuasai semua katakana 100%', xp: 150, unlocked: true, date: 'Jan 2026', rarity: 'Common' },
  { id: 15, icon: '🦅', name: 'Elang N3', desc: 'Capai level N3', xp: 800, unlocked: false, date: null, rarity: 'Legendary' },
  { id: 16, icon: '🌺', name: 'Hanami Lover', desc: 'Login di hari Hanami (25 Mar)', xp: 100, unlocked: true, date: 'Mar 2026', rarity: 'Common' },
  { id: 17, icon: '🎴', name: 'Karuta Master', desc: 'Menangkan mini game Karuta', xp: 250, unlocked: false, date: null, rarity: 'Rare' },
  { id: 18, icon: '🏯', name: 'Kastil Kanji', desc: 'Hafalkan 500 kanji', xp: 700, unlocked: false, date: null, rarity: 'Legendary' },
];

export const ACHIEVEMENT_MILESTONES: AchievementMilestone[] = [
  { level: 'N5', label: 'Pemula', icon: '🌱', status: 'completed', date: 'Januari 2026', desc: 'Kuasai hiragana, katakana, dan 80 kanji dasar', xp: 1200 },
  { level: 'N4', label: 'Dasar', icon: '📚', status: 'active', date: 'Mei 2026 (Sekarang)', desc: 'Tata bahasa menengah, 300 kanji', xp: DASHBOARD_MOCK_USER.totalXp, progress: 77.5 },
  { level: 'N3', label: 'Menengah', icon: '🗺️', status: 'locked', date: 'Target: Agustus 2026', desc: 'Percakapan kompleks, 650 kanji', xp: 0 },
  { level: 'N2', label: 'Lanjutan', icon: '🏔️', status: 'locked', date: 'Target: Januari 2027', desc: 'Teks formal & akademik, 1000 kanji', xp: 0 },
  { level: 'N1', label: 'Mahir', icon: '👑', status: 'locked', date: 'Target: Juli 2027', desc: 'Setara native speaker, 2000 kanji', xp: 0 },
];

export type BadgeFilter = 'all' | 'unlocked' | 'locked';
export type BadgeSort = 'default' | 'rarity-desc' | 'rarity-asc' | 'xp-desc';

export function getAchievementSummary() {
  const unlocked = ACHIEVEMENT_BADGES.filter((b) => b.unlocked);
  const badgeXpTotal = unlocked.reduce((sum, b) => sum + b.xp, 0);

  return {
    unlockedCount: unlocked.length,
    totalCount: ACHIEVEMENT_BADGES.length,
    badgeXpTotal,
    badgeXpTotalLabel: formatDisplayNumber(badgeXpTotal),
    levelProgress: Math.round(
      (DASHBOARD_MOCK_USER.totalXp / DASHBOARD_MOCK_USER.xpToNextLevel) * 100,
    ),
  };
}

export function filterAchievementBadges(
  filter: BadgeFilter,
  rarity: BadgeRarity | 'all',
  sort: BadgeSort,
): AchievementBadge[] {
  let list = ACHIEVEMENT_BADGES.filter((b) => {
    if (filter === 'unlocked') return b.unlocked;
    if (filter === 'locked') return !b.unlocked;
    return true;
  }).filter((b) => (rarity === 'all' ? true : b.rarity === rarity));

  if (sort === 'rarity-desc') {
    list = [...list].sort(
      (a, b) => BADGE_RARITY_ORDER.indexOf(a.rarity) - BADGE_RARITY_ORDER.indexOf(b.rarity),
    );
  } else if (sort === 'rarity-asc') {
    list = [...list].sort(
      (a, b) => BADGE_RARITY_ORDER.indexOf(b.rarity) - BADGE_RARITY_ORDER.indexOf(a.rarity),
    );
  } else if (sort === 'xp-desc') {
    list = [...list].sort((a, b) => b.xp - a.xp);
  }

  return list;
}

export function getBadgeXpByRarity(rarity: BadgeRarity) {
  const badges = ACHIEVEMENT_BADGES.filter((b) => b.rarity === rarity && b.unlocked);
  return {
    count: badges.length,
    xp: badges.reduce((sum, b) => sum + b.xp, 0),
  };
}
