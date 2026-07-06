'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useIsClient } from '@/lib/hooks/use-is-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { THEME_SWITCHING_ENABLED } from '@/lib/theme/theme-config';

type ThemeToggleProps = {
  className?: string;
  /** Ukuran tombol — default `icon` (36px) */
  size?: 'icon' | 'icon-sm';
};

export function ThemeToggle({ className, size = 'icon' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useIsClient();

  if (!THEME_SWITCHING_ENABLED) {
    return null;
  }

  const activeTheme = theme ?? 'system';
  const TriggerIcon = !mounted ? Sun : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn('shrink-0', className)}
          aria-label="Ubah tema tampilan"
          disabled={!mounted}
        >
          <TriggerIcon className={cn('size-5', !mounted && 'opacity-0')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>Tema tampilan</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={activeTheme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun />
            Terang
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon />
            Gelap
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor />
            Sistem
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
