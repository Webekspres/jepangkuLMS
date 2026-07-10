'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { FIXED_THEME, THEME_SWITCHING_ENABLED } from '@/lib/theme/theme-config';

export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();
  const theme: ToasterProps['theme'] = THEME_SWITCHING_ENABLED
    ? resolvedTheme === 'dark'
      ? 'dark'
      : 'light'
    : FIXED_THEME;

  return (
    <Sonner
      {...props}
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          success:
            'group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-emerald-900 group-[.toaster]:!border-emerald-200',
          error:
            'group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-900 group-[.toaster]:!border-red-200',
          warning:
            'group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-950 group-[.toaster]:!border-amber-200',
          info: 'group-[.toaster]:!bg-sky-50 group-[.toaster]:!text-sky-950 group-[.toaster]:!border-sky-200',
        },
      }}
    />
  );
}
