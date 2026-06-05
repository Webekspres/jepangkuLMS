'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flame, Menu, X, Zap } from 'lucide-react';
import { MarketingMobileMenu } from '@/features/marketing/components/marketing-mobile-menu';
import { MarketingNavLinkItem } from '@/features/marketing/components/marketing-nav-link';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { cn } from '@/lib/utils';
import { DASHBOARD_MOCK_USER } from './dashboard-data';
import { STUDENT_NAV_LINKS, STUDENT_PROFILE_LINKS } from './student-nav-links';
import { STUDENT_ROUTES } from './student-routes';
import { StudentUserProfile } from './student-user-profile';

export function StudentNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

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
        'sticky top-0 border-b border-border bg-background/95 shadow-sm backdrop-blur-md',
        menuOpen ? 'z-102' : 'z-50',
      )}
    >
      <div className="relative z-60 container mx-auto flex items-center justify-between gap-4 px-4 py-3.5 md:px-8">
        <Link href={STUDENT_ROUTES.home} className="inline-block shrink-0">
          <Image
            src="/brand/logo.png"
            alt="JepangKu"
            width={BRAND_LOGO.nav.width}
            height={BRAND_LOGO.nav.height}
            className={BRAND_LOGO.nav.className}
            priority
          />
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

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/40 px-3 py-1.5 text-xs font-semibold">
            <Zap className="size-3.5 text-primary" />
            <span className="tabular-nums text-foreground">
              {formatDisplayNumber(DASHBOARD_MOCK_USER.totalXp)} XP
            </span>
            <span className="text-muted-foreground">·</span>
            <Flame className="size-3.5 text-amber-500" />
            <span className="tabular-nums text-foreground">{DASHBOARD_MOCK_USER.streakDays}d</span>
          </div>

          <StudentUserProfile />
        </div>

        <button
          type="button"
          className="rounded-lg p-1 lg:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <MarketingMobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        panelClassName="border border-border bg-background/95 backdrop-blur-xl"
      >
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{DASHBOARD_MOCK_USER.displayName}</p>
          <p className="text-xs text-muted-foreground">
            Level {DASHBOARD_MOCK_USER.level} · {DASHBOARD_MOCK_USER.jlptFocus} ·{' '}
            {formatDisplayNumber(DASHBOARD_MOCK_USER.totalXp)} XP
          </p>
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
          <div className="my-2 border-t border-border" />
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
        </nav>
      </MarketingMobileMenu>
    </nav>
  );
}
