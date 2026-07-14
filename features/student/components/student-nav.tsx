'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Coins, LogOut, Zap, ChevronDown } from 'lucide-react';
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
import { STUDENT_NAV_LINKS } from './student-nav-links';
import { STUDENT_ROUTES } from './student-routes';
import { ProfileAvatar } from './profile-avatar';
import { StudentAccountMenuLinks } from './student-account-menu-links';
import { StudentProfileMenuHeader } from './student-profile-menu-header';
import { StudentUserProfile } from './student-user-profile';
import { StudentNotificationBell } from './student-notification-bell';

function MobileMenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-2 py-0.5">
      {/* Caption / label — ~11px on mobile */}
      <p className="px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-brand-navy uppercase dark:text-foreground">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

export function StudentNav() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();
  const displayName = core.displayName ?? identity?.displayName ?? '…';
  const badgeTitle = core.equippedBadgeTitle;
  const avatarUrl = core.avatarUrl ?? identity?.imageUrl ?? null;
  const avatarInitial = (identity?.initial ?? displayName.slice(0, 2) ?? 'KM').toUpperCase();
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
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Tutup menu akun' : 'Buka menu akun'}
            aria-expanded={menuOpen}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-card py-1 pr-1.5 pl-1 transition-colors hover:bg-muted/40"
          >
            <ProfileAvatar size="sm" imageUrl={avatarUrl} initial={avatarInitial} />
            <ChevronDown
              className={cn(
                'size-3.5 text-muted-foreground transition-transform',
                menuOpen && 'rotate-180',
              )}
            />
          </button>
        </div>
      </div>

      <MarketingMobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        panelClassName="border border-border bg-header backdrop-blur-xl dark:backdrop-blur-none"
      >
        <StudentProfileMenuHeader
          displayName={displayName}
          badgeTitle={badgeTitle}
          level={core.level}
          levelTitle={core.levelTitle}
          totalXp={core.totalXp}
          imageUrl={avatarUrl}
          initial={avatarInitial}
          email={identity?.email}
          onClose={() => setMenuOpen(false)}
        />

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <MobileMenuSection title="Akun Saya">
            <StudentAccountMenuLinks
              isActive={isActive}
              onNavigate={() => setMenuOpen(false)}
            />
          </MobileMenuSection>

          <div className="mx-3 border-t border-border" />

          <MobileMenuSection title="Navigasi">
            {STUDENT_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  // Body ~14px; compact tap targets so logout stays visible
                  'rounded-xl px-3 py-2.5 text-[0.875rem] leading-snug font-medium transition-colors',
                  isActive(link.href)
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            ))}
          </MobileMenuSection>
        </div>

        <div className="shrink-0 border-t border-border px-2 pt-2 pb-safe-lg">
          <Button
            type="button"
            variant="ghost"
            disabled={signingOut}
            className="h-10 w-full justify-start gap-3 px-3 text-[0.875rem] font-medium text-primary hover:bg-primary/5"
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
      </MarketingMobileMenu>
    </nav>
  );
}
