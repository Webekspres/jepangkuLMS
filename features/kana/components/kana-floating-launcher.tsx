'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Languages, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  isKanaFabDismissed,
  KANA_FAB_CHANGE_EVENT,
  setKanaFabDismissed,
} from '@/features/kana/lib/kana-fab-preference';
import { shouldShowKanaFab } from '@/features/kana/lib/kana-fab-visibility';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { isStudentNavHrefActive } from '@/features/student/components/student-nav-links';
import { cn } from '@/lib/utils';

const KANA_LINKS = [
  { href: STUDENT_ROUTES.kanaScript('hiragana'), label: 'Hiragana', sample: 'あ' },
  { href: STUDENT_ROUTES.kanaScript('katakana'), label: 'Katakana', sample: 'ア' },
] as const;

function subscribeKanaFabPreference(onStoreChange: () => void) {
  window.addEventListener(KANA_FAB_CHANGE_EVENT, onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    window.removeEventListener(KANA_FAB_CHANGE_EVENT, onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

export function KanaFloatingLauncher() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const dismissed = useSyncExternalStore(
    subscribeKanaFabPreference,
    isKanaFabDismissed,
    () => true,
  );
  const [open, setOpen] = useState(false);
  const [openForPath, setOpenForPath] = useState(pathname);

  if (pathname !== openForPath) {
    setOpenForPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target || !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  if (dismissed || !shouldShowKanaFab(pathname)) return null;

  const dismiss = () => {
    setKanaFabDismissed(true);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2 pb-safe sm:bottom-6 sm:left-6"
    >
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="kana-fab-panel"
            role="dialog"
            aria-label="Pilih chart aksara"
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            className="pointer-events-auto w-48 origin-bottom-left overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          >
            <div className="relative border-b border-border px-3 py-2.5 pr-9">
              <p className="text-xs font-bold tracking-wide text-foreground uppercase">Aksara</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Tutup menu aksara"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <div className="flex flex-col p-1.5">
              {KANA_LINKS.map((link) => {
                const active = isStudentNavHrefActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg text-base font-bold',
                        active ? 'bg-primary/15' : 'bg-muted',
                      )}
                      aria-hidden
                    >
                      {link.sample}
                    </span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-auto relative">
        <Button
          type="button"
          size="icon"
          className="size-12 rounded-full shadow-md"
          aria-label={open ? 'Tutup menu aksara' : 'Buka chart Hiragana dan Katakana'}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="inline-flex"
          >
            {open ? <X className="size-5" /> : <Languages className="size-5" />}
          </motion.span>
        </Button>

        <AnimatePresence initial={false}>
          {!open ? (
            <motion.button
              key="kana-fab-dismiss"
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={(event) => {
                event.stopPropagation();
                dismiss();
              }}
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Sembunyikan tombol aksara"
            >
              <X className="size-3" />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
