'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MARKETING_NAV_LINKS } from './marketing-nav-links';

type PublicNavbarProps = {
  activeHref?: string;
};

export function PublicNavbar({ activeHref = '/kursus' }: PublicNavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false;
    return href === activeHref;
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3.5 md:px-8">
        <Link href="/" className="inline-block">
          <Image
            src="/brand/logo.png"
            alt="JepangKu"
            width={150}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {MARKETING_NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors',
                isActive(link.href)
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="outline" className="h-10 rounded-full border-2 px-5 font-semibold">
            <Link href="/sign-in">Masuk</Link>
          </Button>
          <Button
            asChild
            className="h-10 rounded-full border-0 bg-linear-to-br from-brand-red to-brand-orange px-5 font-semibold text-primary-foreground shadow-lg hover:opacity-90"
          >
            <Link href="/sign-up">Daftar Gratis</Link>
          </Button>
        </div>

        <button
          type="button"
          className="relative z-60 rounded-lg p-1 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 top-14 z-40 bg-brand-navy/50 backdrop-blur-sm md:hidden"
              aria-label="Tutup menu"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full right-4 left-4 z-50 overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-xl md:hidden"
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
                <Button asChild variant="outline" className="h-11 w-full rounded-full border-2 font-semibold">
                  <Link href="/sign-in" onClick={() => setMenuOpen(false)}>
                    Masuk
                  </Link>
                </Button>
                <Button
                  asChild
                  className="h-11 w-full rounded-full border-0 bg-linear-to-br from-brand-red to-brand-orange font-semibold text-primary-foreground shadow-lg"
                >
                  <Link href="/sign-up" onClick={() => setMenuOpen(false)}>
                    Daftar Gratis
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
