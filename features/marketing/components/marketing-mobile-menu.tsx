'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { LANDING_NAV_MENU_TOP, PUBLIC_NAV_MENU_TOP } from './marketing-nav-layout';

type MarketingMobileMenuProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  panelClassName?: string;
  /** Offset top panel; default PublicNavbar (py-3.5). */
  panelTop?: string;
};

/**
 * Overlay mobile menu via portal ke document.body.
 * Menghindari bug `position:fixed` di dalam parent ber-transform (motion.nav).
 */
export function MarketingMobileMenu({
  open,
  onClose,
  children,
  panelClassName,
  panelTop = PUBLIC_NAV_MENU_TOP,
}: MarketingMobileMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 bg-brand-navy/50 backdrop-blur-sm md:hidden"
            aria-label="Tutup menu"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed right-4 left-4 overflow-hidden rounded-2xl shadow-2xl md:hidden',
              panelTop,
              'z-101',
              panelClassName,
            )}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
