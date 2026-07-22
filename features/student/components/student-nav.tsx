'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { Coins, LogOut, Zap, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
import {
  isStudentNavGroupActive,
  isStudentNavHrefActive,
  isStudentNavLink,
  STUDENT_NAV_ITEMS,
} from './student-nav-links';
import { StudentNavDropdownGroup } from './student-nav-dropdown-group';
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
      <p className="px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-brand-navy uppercase dark:text-foreground">
        {title}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function MobileMenuAccordionSection({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="px-2 py-0.5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
          open ? 'bg-muted' : 'bg-muted/40 hover:bg-muted/70',
        )}
      >
        <span className="min-w-0">
          <span className="block text-[11px] font-extrabold tracking-[0.14em] text-brand-navy uppercase dark:text-foreground">
            {title}
          </span>
          <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
            {open ? 'Ketuk untuk menutup' : 'Ketuk untuk membuka'}
          </span>
        </span>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-background/80"
          aria-hidden
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="inline-flex"
          >
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="akun-accordion-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="flex flex-col pt-1">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
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
  const [akunAccordionOpen, setAkunAccordionOpen] = useState(false);
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

  useEffect(() => {
    if (!menuOpen) setAkunAccordionOpen(false);
  }, [menuOpen]);

  const isActive = (href: string) => isStudentNavHrefActive(pathname, href);

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

        <div className="hidden items-center gap-6 xl:gap-8 lg:flex">
          {STUDENT_NAV_ITEMS.map((item) =>
            isStudentNavLink(item) ? (
              <MarketingNavLinkItem
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(item.href)}
                external={item.external}
              />
            ) : (
              <StudentNavDropdownGroup
                key={item.label}
                group={item}
                pathname={pathname}
                active={isStudentNavGroupActive(pathname, item)}
              />
            ),
          )}
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
          <MobileMenuAccordionSection
            title="Akun Saya"
            open={akunAccordionOpen}
            onOpenChange={setAkunAccordionOpen}
          >
            <StudentAccountMenuLinks
              isActive={isActive}
              onNavigate={() => setMenuOpen(false)}
            />
          </MobileMenuAccordionSection>

          <div className="mx-3 border-t border-border" />

          <MobileMenuSection title="Navigasi">
            {STUDENT_NAV_ITEMS.map((item) =>
              isStudentNavLink(item) ? (
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-[0.875rem] leading-snug font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      'rounded-xl px-3 py-2.5 text-[0.875rem] leading-snug font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-primary/10 font-semibold text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                )
              ) : (
                <div key={item.label} className="py-0.5">
                  <p
                    className={cn(
                      'px-3 py-1.5 text-[11px] font-extrabold tracking-[0.14em] uppercase',
                      isStudentNavGroupActive(pathname, item)
                        ? 'text-primary'
                        : 'text-brand-navy dark:text-foreground',
                    )}
                  >
                    {item.label}
                  </p>
                  <div className="ml-2 flex flex-col border-l border-border pl-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'rounded-xl px-3 py-2 text-[0.875rem] leading-snug font-medium transition-colors',
                          isActive(child.href)
                            ? 'bg-primary/10 font-semibold text-primary'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ),
            )}
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
