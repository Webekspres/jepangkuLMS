import Image from 'next/image';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { cn } from '@/lib/utils';

const FOOTER_LOGO = {
  width: 150,
  height: 40,
  className: 'h-9 w-auto object-contain',
} as const;

type BrandLogoVariant = 'nav' | 'authForm' | 'footer';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  priority?: boolean;
  className?: string;
};

/** Logo merek dengan swap otomatis light/dark — lihat DESIGN.md §3.4 */
export function BrandLogo({ variant = 'nav', priority, className }: BrandLogoProps) {
  const config = variant === 'footer' ? FOOTER_LOGO : BRAND_LOGO[variant];
  const imgClass = cn(config.className, className);

  return (
    <span className="relative inline-block leading-none">
      <Image
        src="/brand/logo.png"
        alt="JepangKu"
        width={config.width}
        height={config.height}
        className={cn(imgClass, 'dark:hidden')}
        priority={priority}
      />
      <Image
        src="/brand/logo-white.png"
        alt="JepangKu"
        width={config.width}
        height={config.height}
        className={cn(imgClass, 'hidden dark:inline-block')}
        priority={priority}
      />
    </span>
  );
}
