'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdminTableActions({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex shrink-0 items-center justify-end gap-1.5', className)}>{children}</div>
  );
}

type AdminTableActionProps = {
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  showLabel?: boolean;
  external?: boolean;
  type?: 'button' | 'submit';
};

/** Neutral table action — outline, icon-only by default. */
export function AdminTableAction({
  label,
  icon: Icon,
  href,
  onClick,
  disabled,
  showLabel = false,
  external = false,
  type = 'button',
}: AdminTableActionProps) {
  const size = showLabel ? 'sm' : 'icon-sm';
  const content = (
    <>
      <Icon className="size-3.5" />
      {showLabel ? <span>{label}</span> : null}
    </>
  );

  if (href) {
    return (
      <Button asChild size={size} variant="outline" disabled={disabled}>
        <Link
          href={href}
          aria-label={label}
          title={label}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {content}
        </Link>
      </Button>
    );
  }

  return (
    <Button
      type={type}
      size={size}
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {content}
    </Button>
  );
}

type AdminTableActionDeleteProps = {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
};

/** Destructive delete action — uses semantic `destructive` token. */
export function AdminTableActionDelete({
  label = 'Hapus',
  onClick,
  disabled,
}: AdminTableActionDeleteProps) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="destructive"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}
