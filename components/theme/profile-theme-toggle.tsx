'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { motion } from 'motion/react';
import { useIsClient } from '@/lib/hooks/use-is-client';
import { cn } from '@/lib/utils';
import { THEME_SWITCHING_ENABLED } from '@/lib/theme/theme-config';

type ProfileThemeToggleProps = {
  className?: string;
};

export function ProfileThemeToggle({ className }: ProfileThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();

  if (!THEME_SWITCHING_ENABLED) {
    return null;
  }

  const isDark = mounted && resolvedTheme === 'dark';

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!mounted}
      className={cn(
        'flex w-full items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60 disabled:opacity-60',
        className,
      )}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
    >
      <Sun className={cn('size-4 shrink-0', isDark ? 'text-muted-foreground' : 'text-amber-500')} />
      <span className="flex-1 text-left text-foreground">
        {isDark ? 'Mode Gelap' : 'Mode Terang'}
      </span>
      <span
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          isDark ? 'bg-secondary' : 'bg-muted',
        )}
        aria-hidden
      >
        <motion.span
          className="absolute top-1 flex size-4 items-center justify-center rounded-full bg-card shadow-sm"
          animate={{ x: isDark ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isDark ? (
            <Moon className="size-2.5 text-blue-400" />
          ) : (
            <Sun className="size-2.5 text-amber-500" />
          )}
        </motion.span>
      </span>
      <Moon className={cn('size-4 shrink-0', isDark ? 'text-blue-400' : 'text-muted-foreground')} />
    </button>
  );
}
