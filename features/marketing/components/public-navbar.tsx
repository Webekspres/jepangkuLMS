'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { cn } from '@/lib/utils';
import { THEME_SWITCHING_ENABLED } from '@/lib/theme/theme-config';
import { MarketingMobileMenu } from './marketing-mobile-menu';
import { MarketingNavLinkItem } from './marketing-nav-link';
import { MARKETING_NAV_LINKS } from './marketing-nav-links';

type PublicNavbarProps = {
  /** Opsional — override state aktif; default dari pathname saat ini */
  activeHref?: string;
};

export function PublicNavbar({ activeHref }: PublicNavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const resolvedActive = activeHref ?? pathname;

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    return resolvedActive === href || resolvedActive.startsWith(`${href}/`);
  };

  return (
    <nav
      className={cn(
        'sticky top-0 border-b border-border bg-header shadow-sm backdrop-blur-md dark:backdrop-blur-none',
        menuOpen ? 'z-102' : 'z-50',
      )}
    >
      <div className="relative z-60 container mx-auto flex items-center justify-between px-4 py-3.5 md:px-8">
        <Link href="/" className="inline-block">
          <BrandLogo variant="nav" priority />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {MARKETING_NAV_LINKS.map((link) => (
            <MarketingNavLinkItem
              key={link.href}
              href={link.href}
              label={link.label}
              active={isActive(link.href)}
            />
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Button asChild variant="outline" className="h-10 px-5">
            <Link href="/sign-in">Masuk</Link>
          </Button>
          <Button asChild className="h-10 px-5">
            <Link href="/sign-up">Daftar Gratis</Link>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle size="icon-sm" />
          <button
            type="button"
            className="relative rounded-lg p-1"
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
        <nav className="flex flex-col p-2">
          {MARKETING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'bg-primary/10 font-semibold text-primary'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              <link.icon className="size-4 shrink-0 opacity-70" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-2 border-t border-border bg-muted/30 p-4">
          {THEME_SWITCHING_ENABLED ? (
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-xs font-medium text-muted-foreground">Tema tampilan</span>
              <ThemeToggle size="icon-sm" />
            </div>
          ) : null}
          <Button asChild variant="outline" className="h-11 w-full">
            <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
              Masuk
            </Link>
          </Button>
          <Button asChild className="h-11 w-full">
            <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
              Daftar Gratis
            </Link>
          </Button>
        </div>
      </MarketingMobileMenu>
    </nav>
  );
}
