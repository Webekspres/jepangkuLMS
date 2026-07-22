import Link from 'next/link';
import { cn } from '@/lib/utils';

type MarketingNavLinkItemProps = {
  href: string;
  label: string;
  active?: boolean;
  /** Open in a new tab (external sites, e.g. Portal Berita). */
  external?: boolean;
  /** `light` = teks putih di atas hero gelap (landing belum scroll) */
  variant?: 'default' | 'light';
  className?: string;
};

export function MarketingNavLinkItem({
  href,
  label,
  active = false,
  external = false,
  variant = 'default',
  className,
}: MarketingNavLinkItemProps) {
  const showLine = active;

  const classNames = cn(
    'group relative inline-block py-1 text-sm font-medium transition-colors duration-300',
    variant === 'light'
      ? active
        ? 'font-semibold text-white'
        : 'text-white/90 hover:text-white'
      : active
        ? 'font-semibold text-primary'
        : 'text-muted-foreground hover:text-primary',
    className,
  );

  const underline = (
    <span
      aria-hidden
      className={cn(
        'absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-primary transition-transform duration-300 ease-out',
        showLine ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
      )}
      style={{ transformOrigin: 'center bottom' }}
    />
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classNames}>
        {label}
        {underline}
      </a>
    );
  }

  return (
    <Link href={href} className={classNames}>
      {label}
      {underline}
    </Link>
  );
}
