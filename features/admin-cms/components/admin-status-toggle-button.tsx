'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminStatusToggleButtonProps = {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  activeHint: string;
  inactiveHint: string;
  disabled?: boolean;
  onClick: () => void;
};

export function AdminStatusToggleButton({
  active,
  activeLabel,
  inactiveLabel,
  activeHint,
  inactiveHint,
  disabled,
  onClick,
}: AdminStatusToggleButtonProps) {
  const label = active ? activeLabel : inactiveLabel;
  const hint = active ? activeHint : inactiveHint;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={hint}
      className={cn(
        'group inline-flex min-w-32 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left shadow-xs transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        active
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:border-emerald-500/50 hover:bg-emerald-500/15'
          : 'border-primary/25 bg-primary/5 text-primary hover:border-primary/45 hover:bg-primary/10',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-xs font-bold leading-none">{label}</span>
        <span className="mt-1 text-[10px] font-medium opacity-75">{hint}</span>
      </span>
      {disabled ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" />
      ) : (
        <ChevronDown className="size-3.5 shrink-0 opacity-70 transition-transform group-hover:translate-y-0.5" />
      )}
    </button>
  );
}
