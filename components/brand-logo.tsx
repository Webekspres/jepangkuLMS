import Image from 'next/image';
import { BRAND_LOGO } from '@/lib/brand-logo';
import { cn } from '@/lib/utils';

const FOOTER_LOGO = {
  width: 150,
  height: 40,
  className: 'h-9 w-auto object-contain',
} as const;

/**
 * `nav` / `authForm` / `footer` — selalu tampilkan logo berwarna (logo.png).
 * `footer-dark` — khusus untuk panel dark yang butuh kontras: tampilkan logo putih.
 * `auth-panel-white` — panel brand kiri auth (selalu putih).
 */
type BrandLogoVariant = 'nav' | 'authForm' | 'footer' | 'footer-dark' | 'auth-panel-white';

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  priority?: boolean;
  className?: string;
};

export function BrandLogo({ variant = 'nav', priority, className }: BrandLogoProps) {
  const config =
    variant === 'footer' || variant === 'footer-dark' ? FOOTER_LOGO : BRAND_LOGO[variant === 'auth-panel-white' ? 'authPanel' : variant] ?? BRAND_LOGO.nav;
  const imgClass = cn(config.className, className);

  const src = '/brand/logo.png';

  return (
    <Image
      src={src}
      alt="JepangKu"
      width={config.width}
      height={config.height}
      className={imgClass}
      priority={priority}
    />
  );
}
