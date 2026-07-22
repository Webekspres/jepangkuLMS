'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Languages, LayoutDashboard } from 'lucide-react';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { cn } from '@/lib/utils';
import {
  isKanaFabDismissed,
  KANA_FAB_CHANGE_EVENT,
  setKanaFabDismissed,
} from '@/features/kana/lib/kana-fab-preference';
import { useStudentCoreData } from './student-core-data-context';
import { STUDENT_ACCOUNT_MENU_ITEMS } from './student-account-menu-items';

type StudentAccountMenuLinksProps = {
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
  /** Compact text-only links for narrow contexts */
  variant?: 'default' | 'plain';
};

export function StudentAccountMenuLinks({
  isActive,
  onNavigate,
  variant = 'default',
}: StudentAccountMenuLinksProps) {
  const core = useStudentCoreData();
  const [showRestoreKanaFab, setShowRestoreKanaFab] = useState(false);

  useEffect(() => {
    const sync = () => setShowRestoreKanaFab(isKanaFabDismissed());
    sync();
    window.addEventListener(KANA_FAB_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(KANA_FAB_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const linkClass = (href: string) =>
    cn(
      variant === 'plain'
        ? 'rounded-xl px-3 py-2.5 text-[0.875rem] leading-snug font-medium transition-colors'
        : 'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.875rem] leading-snug font-medium transition-colors',
      isActive(href)
        ? 'bg-primary/10 font-semibold text-primary'
        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    );

  const actionClass = cn(
    variant === 'plain'
      ? 'rounded-xl px-3 py-2.5 text-left text-[0.875rem] leading-snug font-medium transition-colors'
      : 'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.875rem] leading-snug font-medium transition-colors',
    'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
  );

  return (
    <>
      {core.canAccessAdmin ? (
        <Link
          href={ADMIN_ROUTES.dashboard}
          role="menuitem"
          onClick={onNavigate}
          className={linkClass(ADMIN_ROUTES.dashboard)}
        >
          {variant === 'default' ? (
            <LayoutDashboard className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          ) : null}
          Dashboard Admin
        </Link>
      ) : null}
      {STUDENT_ACCOUNT_MENU_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          role="menuitem"
          onClick={onNavigate}
          className={linkClass(item.href)}
        >
          {variant === 'default' ? (
            <item.icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          ) : null}
          {item.label}
        </Link>
      ))}
      {showRestoreKanaFab ? (
        <button
          type="button"
          role="menuitem"
          className={actionClass}
          onClick={() => {
            setKanaFabDismissed(false);
            setShowRestoreKanaFab(false);
            onNavigate?.();
          }}
        >
          {variant === 'default' ? (
            <Languages className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          ) : null}
          Tampilkan pintasan Aksara
        </button>
      ) : null}
    </>
  );
}
