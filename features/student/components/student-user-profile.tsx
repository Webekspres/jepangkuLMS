'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
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
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import { cn } from '@/lib/utils';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_ROUTES } from './student-routes';

const MENU_ITEMS = [
  { href: STUDENT_ROUTES.home, label: 'Beranda', icon: LayoutDashboard },
  { href: STUDENT_ROUTES.profil, label: 'Profil & XP', icon: User },
  { href: STUDENT_ROUTES.achievements, label: 'Pencapaian', icon: Award },
  { href: STUDENT_ROUTES.leaderboard, label: 'Leaderboard', icon: Trophy },
] as const;

function UserAvatar({
  className,
  imageUrl,
  initial,
}: {
  className?: string;
  imageUrl: string | null;
  initial: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt=""
        width={32}
        height={32}
        className={cn('size-8 shrink-0 rounded-full border-2 border-primary/20 object-cover', className)}
      />
    );
  }

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
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const displayName = identity?.displayName ?? '…';
  const email = identity?.email;
  const imageUrl = identity?.imageUrl ?? null;
  const initial = identity?.initial ?? '?';
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
        <UserAvatar imageUrl={imageUrl} initial={initial} />
        <span className="max-w-28 truncate">{displayName}</span>
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
              <UserAvatar className="size-10 text-sm" imageUrl={imageUrl} initial={initial} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{displayName}</p>
                {email ? (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
                <p className="truncate text-xs text-muted-foreground">
                  Lv.{core.level} · {formatDisplayNumber(core.totalXp)} XP ·{' '}
                  {formatDisplayNumber(core.currentPoints)} poin
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
              onClick={() => {
                setOpen(false);
                setSigningOut(true);
                void signOutFromApp(signOut).finally(() => setSigningOut(false));
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
