'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ChevronDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  Target,
  Trophy,
  User,
} from 'lucide-react';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import { useIsClient } from '@/lib/hooks/use-is-client';
import { cn } from '@/lib/utils';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_ROUTES } from './student-routes';

const XP_PER_LEVEL = 800;

const MENU_ITEMS = [
  { href: STUDENT_ROUTES.profil, label: 'Profil Saya', icon: User },
  { href: STUDENT_ROUTES.kursus, label: 'Kursus Saya', icon: BookOpen },
  { href: STUDENT_ROUTES.tryout, label: 'JLPT Try Out', icon: Target },
  { href: STUDENT_ROUTES.achievements, label: 'Achievements', icon: Trophy },
] as const;

function ProfileThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();

  const isDark = mounted && resolvedTheme === 'dark';

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      className="flex w-full items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-60"
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
    >
      <Sun className={cn('size-4 shrink-0', isDark ? 'text-muted-foreground' : 'text-amber-500')} />
      <span className="flex-1 text-left text-foreground">
        {isDark ? 'Mode Gelap' : 'Mode Terang'}
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          isDark ? 'bg-secondary' : 'bg-muted',
        )}
        aria-hidden
      >
        <motion.span
          className="absolute top-1 flex size-4 items-center justify-center rounded-full bg-card shadow-sm"
          animate={{ x: isDark ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isDark ? (
            <Moon className="size-2.5 text-blue-400" />
          ) : (
            <Sun className="size-2.5 text-amber-500" />
          )}
        </motion.span>
      </span>
      <Moon className={cn('size-4 shrink-0', isDark ? 'text-blue-400' : 'text-muted-foreground')} />
    </button>
  );
}

function ProfileAvatar({
  className,
  imageUrl,
  initial,
  size = 'md',
}: {
  className?: string;
  imageUrl: string | null;
  initial: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClass =
    size === 'lg' ? 'size-12 rounded-xl text-lg' : size === 'sm' ? 'size-7 rounded-lg text-xs' : 'size-10 rounded-xl text-sm';

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={size === 'lg' ? 48 : size === 'sm' ? 28 : 40}
        height={size === 'lg' ? 48 : size === 'sm' ? 28 : 40}
        className={cn('shrink-0 object-cover shadow-md', sizeClass, className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center bg-linear-to-br from-primary to-brand-orange font-bold text-primary-foreground shadow-md',
        sizeClass,
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function xpProgressPercent(totalXp: number, level: number): number {
  if (totalXp <= 0) return 0;
  const xpInLevel = totalXp - (level - 1) * XP_PER_LEVEL;
  const pct = (xpInLevel / XP_PER_LEVEL) * 100;
  return Math.min(99.9, Math.max(0, Math.round(pct * 10) / 10));
}

export function StudentUserProfile() {
  const { signOut } = useClerk();
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const displayName = identity?.displayName ?? core.displayName ?? 'Kamu';
  const imageUrl = identity?.imageUrl ?? core.avatarUrl ?? null;
  const initial = (identity?.initial ?? displayName.slice(0, 2) ?? 'KM').toUpperCase();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const nextLevel = core.level + 1;
  const xpPercent = xpProgressPercent(core.totalXp, core.level);
  const levelSubtitle = core.levelTitle
    ? `${core.levelTitle} • Lv.${core.level}`
    : `Pemula • Lv.${core.level}`;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-border bg-card py-1 pr-2 pl-1 transition-colors hover:bg-muted/40',
        )}
      >
        <ProfileAvatar size="sm" imageUrl={imageUrl} initial={initial} />
        <span className="hidden max-w-24 truncate text-sm font-semibold text-foreground sm:inline">
          {displayName}
        </span>
        <ChevronDown
          className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header — pink tint + XP bar */}
            <div className="border-b border-border bg-primary/5 p-4 dark:bg-primary/10">
              <div className="mb-3 flex items-center gap-3">
                <ProfileAvatar size="lg" imageUrl={imageUrl} initial={initial} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
                    <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Level N5
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{levelSubtitle}</p>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted-foreground">XP ke Lv.{nextLevel}</span>
                  <span className="font-bold text-primary">{xpPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-primary to-brand-yellow"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {formatDisplayNumber(core.totalXp)} XP total
                </p>
              </div>
            </div>

            {/* Nav links */}
            <div className="p-2">
              {MENU_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                >
                  <item.icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mx-2 border-t border-border" />

            <div className="px-2 pt-2">
              <ProfileThemeToggle />
            </div>

            <div className="p-2 pt-1">
              <Link
                href={STUDENT_ROUTES.profil}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
              >
                <Settings className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                Pengaturan Akun
              </Link>
              <button
                type="button"
                role="menuitem"
                disabled={signingOut}
                onClick={() => {
                  setOpen(false);
                  setSigningOut(true);
                  void signOutFromApp(signOut).finally(() => setSigningOut(false));
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
              >
                <LogOut className="size-4 shrink-0" />
                {signingOut ? 'Keluar…' : 'Keluar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
