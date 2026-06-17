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

function FooterLinkGroup({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="mb-4 text-sm font-bold tracking-wide text-foreground">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
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
    <footer className="bg-background">
      <div className="container mx-auto px-4 py-14 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-block">
              <BrandLogo variant="footer" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Platform belajar bahasa Jepang terstruktur JLPT — video lesson, kuis interaktif, try
              out, dan gamifikasi XP.
            </p>
            <Button asChild className="mt-5 h-10 gap-2 px-5 text-sm font-semibold">
              <a href={FOOTER_WA_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Chat Admin
              </a>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">{ADMIN_CONTACT.hours}</p>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <FooterLinkGroup title="Jelajahi" links={MARKETING_FOOTER_EXPLORE} />
              <FooterLinkGroup title="Bantuan" links={MARKETING_FOOTER_SUPPORT} />
              <FooterLinkGroup title="Legal" links={MARKETING_FOOTER_LEGAL} />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© 2026 JepangKu. Semua hak dilindungi.</p>
          <p>Bagian dari ekosistem JepangKu · kursus.jepangku.com</p>
        </div>
      </div>
    </footer>
  );
}
