'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useClerk } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import {
  Award,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Trophy,
  User,
} from 'lucide-react';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import { DASHBOARD_MOCK_USER } from './dashboard-data';
import { STUDENT_ROUTES } from './student-routes';

const MENU_ITEMS = [
  { href: STUDENT_ROUTES.home, label: 'Beranda', icon: LayoutDashboard },
  { href: STUDENT_ROUTES.profil, label: 'Profil & XP', icon: User },
  { href: STUDENT_ROUTES.achievements, label: 'Pencapaian', icon: Award },
  { href: STUDENT_ROUTES.leaderboard, label: 'Leaderboard', icon: Trophy },
] as const;

function UserAvatar({ className }: { className?: string }) {
  const initial = DASHBOARD_MOCK_USER.displayName.charAt(0).toUpperCase();

  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10 text-xs font-bold text-primary',
        className,
      )}
      aria-hidden
    >
      {initial}
    </span>
  );
}

export function StudentUserProfile() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
          'inline-flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 text-sm font-semibold text-foreground transition-all',
          'shadow-[0_3px_0_0_color-mix(in_srgb,var(--foreground)_10%,transparent)]',
          'hover:bg-muted/40 active:translate-y-px active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--foreground)_10%,transparent)]',
          open && 'translate-y-px shadow-[0_1px_0_0_color-mix(in_srgb,var(--foreground)_10%,transparent)]',
        )}
      >
        <UserAvatar />
        <span className="max-w-28 truncate">{DASHBOARD_MOCK_USER.displayName}</span>
        <ChevronDown
          className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <UserAvatar className="size-10 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">
                  {DASHBOARD_MOCK_USER.displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Lv.{DASHBOARD_MOCK_USER.level} · {DASHBOARD_MOCK_USER.jlptFocus} ·{' '}
                  {formatDisplayNumber(DASHBOARD_MOCK_USER.totalXp)} XP
                </p>
              </div>
            </div>
          </div>

          <ul className="p-1.5">
            {MENU_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/60',
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border p-1.5">
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={async () => {
                setOpen(false);
                setSigningOut(true);
                try {
                  await fetch('/api/auth/sign-out', { method: 'POST' });
                  await signOut({ redirectUrl: '/sign-in' });
                } finally {
                  setSigningOut(false);
                }
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:opacity-60"
            >
              <LogOut className="size-4 shrink-0" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
