'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Coins, LogOut, Menu, X, Zap } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketingMobileMenu } from '@/features/marketing/components/marketing-mobile-menu';
import { MarketingNavLinkItem } from '@/features/marketing/components/marketing-nav-link';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import { isCoreIntegrationEnabled } from '@/lib/core/integration-config';
import { cn } from '@/lib/utils';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_NAV_LINKS, STUDENT_PROFILE_LINKS } from './student-nav-links';
import { STUDENT_ROUTES } from './student-routes';
import { StudentUserProfile } from './student-user-profile';
import { StudentNotificationBell } from './student-notification-bell';

export function StudentNav() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const displayName = core.displayName ?? identity?.displayName ?? '…';
  const badgeTitle = core.equippedBadgeTitle;
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const statsPending =
    !hydrated ||
    (isCoreIntegrationEnabled() && core.status === 'loading' && !core.coreConnected);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href === STUDENT_ROUTES.home) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        'sticky top-0 border-b border-border bg-header shadow-sm backdrop-blur-md dark:backdrop-blur-none',
        menuOpen ? 'z-102' : 'z-50',
      )}
    >
      <div className="relative z-60 container mx-auto flex items-center justify-between gap-4 px-4 py-3.5 md:px-8">
        <Link href={STUDENT_ROUTES.home} className="inline-block shrink-0">
          <BrandLogo variant="nav" priority />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {STUDENT_NAV_LINKS.map((link) => (
            <MarketingNavLinkItem
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(link.href)}
            />
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {statsPending ? (
            <Skeleton className="h-8 w-30 rounded-sm" aria-hidden />
          ) : (
            <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold">
              <Zap className="size-3.5 text-primary" />
              <span className="tabular-nums text-foreground">
                {formatDisplayNumber(core.totalXp)} XP
              </span>
              <span className="text-muted-foreground">·</span>
              <Coins className="size-3.5 text-amber-500" />
              <span className="tabular-nums text-foreground">
                {formatDisplayNumber(core.lmsPoints)}
              </span>
            </div>
          )}

          <StudentNotificationBell />
          <StudentUserProfile />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <StudentNotificationBell />
          <StudentUserProfile />
          <button
            type="button"
            className="rounded-lg p-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      <MarketingMobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        panelClassName="border border-border bg-header backdrop-blur-xl dark:backdrop-blur-none"
      >
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{displayName}</p>
          {badgeTitle ? (
            <p className="text-xs font-medium text-primary">{badgeTitle}</p>
          ) : null}
          {identity?.email ? (
            <p className="truncate text-xs text-muted-foreground">{identity.email}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Lv.{core.level} · {formatDisplayNumber(core.totalXp)} XP
            </p>
          )}
        </div>
        <nav className="flex flex-col p-2">
          {STUDENT_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'rounded-xl px-4 py-3.5 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
          {STUDENT_PROFILE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="rounded-xl px-4 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              disabled={signingOut}
              className="h-11 w-full justify-start gap-3 px-4 text-sm font-medium"
              onClick={() => {
                setMenuOpen(false);
                setSigningOut(true);
                void signOutFromApp(signOut).finally(() => setSigningOut(false));
              }}
            >
              <LogOut className="size-4 shrink-0" />
              {signingOut ? 'Keluar…' : 'Keluar'}
            </Button>
          </div>
        </nav>
      </MarketingMobileMenu>
    </nav>
  );
}
