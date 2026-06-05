'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BRAND_LOGO } from '@/lib/brand-logo';
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
        'sticky top-0 border-b border-border bg-background/95 shadow-sm backdrop-blur-md',
        menuOpen ? 'z-102' : 'z-50',
      )}
    >
      <div className="relative z-60 container mx-auto flex items-center justify-between px-4 py-3.5 md:px-8">
        <Link href="/" className="inline-block">
          <Image
            src="/brand/logo.png"
            alt="JepangKu"
            width={BRAND_LOGO.nav.width}
            height={BRAND_LOGO.nav.height}
            className={BRAND_LOGO.nav.className}
            priority
          />
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

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="outline" className="h-10 px-5">
            <Link href="/sign-in">Masuk</Link>
          </Button>
          <Button asChild className="h-10 px-5">
            <Link href="/sign-up">Daftar Gratis</Link>
          </Button>
        </div>

        <button
          type="button"
          className="relative rounded-lg p-1 md:hidden"
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
