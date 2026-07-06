import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ADMIN_CONTACT, buildWhatsAppUrl } from '@/lib/admin-contact';
import {
  MARKETING_FOOTER_EXPLORE,
  MARKETING_FOOTER_LEGAL,
  MARKETING_FOOTER_SUPPORT,
} from './marketing-nav-links';

const FOOTER_WA_URL = buildWhatsAppUrl('Halo, saya ingin bertanya tentang JepangKu LMS.');

const FOOTER_SOCIAL_LINKS = [
  {
    href: "https://www.instagram.com/jepangkunihongo/",
    label: "Instagram",
    icon: "instagram" as const,
  },
  {
    href: "https://www.youtube.com/@jepangkuofficial",
    label: "YouTube",
    icon: "youtube" as const,
  },
  {
    href: "https://www.tiktok.com/@jepangkuofficial",
    label: "TikTok",
    icon: "tiktok" as const,
  },
] as const;

function InstagramIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YouTubeIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function TikTokIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

const FOOTER_SOCIAL_ICONS = {
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
  tiktok: TikTokIcon,
} as const;

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold tracking-wide text-white/90">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/55 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-brand-hero-navy">
      {/* Footer backdrop (bg-footer.webp) + overlay to protect text contrast */}
      <div
        className="pointer-events-none absolute inset-0 bg-[url('/assets/bg-footer.webp')] bg-cover bg-bottom-right opacity-35"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-brand-hero-navy/80" aria-hidden />
      <div className="relative z-10 container mx-auto px-4 py-14 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-block">
              <BrandLogo variant="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              Platform belajar bahasa Jepang terstruktur JLPT — video lesson, kuis interaktif, try
              out, dan gamifikasi XP.
            </p>
            <Button
              asChild
              variant="ghost"
              className="mt-5 h-10 gap-2 border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white hover:bg-white/20 hover:text-white"
            >
              <a href={FOOTER_WA_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Chat Admin
              </a>
            </Button>
            <p className="mt-3 text-xs text-white/40">{ADMIN_CONTACT.hours}</p>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-8 grid-cols-2 sm:grid-cols-4">
              <FooterLinkGroup title="Jelajahi" links={MARKETING_FOOTER_EXPLORE} />
              <FooterLinkGroup title="Bantuan" links={MARKETING_FOOTER_SUPPORT} />
              <FooterLinkGroup title="Legal" links={MARKETING_FOOTER_LEGAL} />
              <div>
                <h3 className="mb-4 text-sm font-bold tracking-wide text-white/90">Ikuti Kami</h3>
                <ul className="space-y-2.5">
                  {FOOTER_SOCIAL_LINKS.map((link) => {
                    const Icon = FOOTER_SOCIAL_ICONS[link.icon];
                    return (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
                        >
                          <Icon className="size-4 text-brand-yellow" />
                          {link.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <p>© 2026 JepangKu. Semua hak dilindungi.</p>
          <p>Bagian dari ekosistem JepangKu · kursus.jepangku.com</p>
        </div>
      </div>
    </footer>
  );
}
