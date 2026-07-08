'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, LogOut } from 'lucide-react';
import { ProfileThemeToggle } from '@/components/theme/profile-theme-toggle';
import { THEME_SWITCHING_ENABLED } from '@/lib/theme/theme-config';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import { ProfileAvatar } from '@/features/student/components/profile-avatar';
import { cn } from '@/lib/utils';
import { StudentAccountMenuLinks } from './student-account-menu-links';
import { StudentProfileMenuHeader } from './student-profile-menu-header';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_ROUTES } from './student-routes';

export function StudentUserProfile() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const displayName = core.displayName ?? identity?.displayName ?? 'Kamu';
  const imageUrl = core.avatarUrl ?? identity?.imageUrl ?? null;
  const initial = (identity?.initial ?? displayName.slice(0, 2) ?? 'KM').toUpperCase();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === STUDENT_ROUTES.home) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

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
            <StudentProfileMenuHeader
              displayName={displayName}
              badgeTitle={core.equippedBadgeTitle}
              level={core.level}
              levelTitle={core.levelTitle}
              totalXp={core.totalXp}
              imageUrl={imageUrl}
              initial={initial}
            />

            <div className="p-2">
              <StudentAccountMenuLinks
                isActive={isActive}
                onNavigate={() => setOpen(false)}
              />
            </div>

            {THEME_SWITCHING_ENABLED ? (
              <>
                <div className="mx-2 border-t border-border" />
                <div className="px-2 pt-2">
                  <ProfileThemeToggle />
                </div>
              </>
            ) : null}

            <div className="p-2 pt-1">
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
