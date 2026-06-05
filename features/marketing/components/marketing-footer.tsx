import Image from 'next/image';
import Link from 'next/link';
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
      <h3 className="mb-4 text-sm font-bold tracking-wide text-white">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/60 transition-colors hover:text-white"
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
    <footer className="bg-brand-navy text-white/60">
      <div className="container mx-auto px-4 py-14 md:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-block">
              <Image
                src="/brand/logo-white.png"
                alt="JepangKu"
                width={150}
                height={40}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Platform belajar bahasa Jepang terstruktur JLPT — video lesson, kuis interaktif, try
              out, dan gamifikasi XP.
            </p>
            <Button
              asChild
              className="mt-5 h-10 gap-2 rounded-full border-0 bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-600/90"
            >
              <a href={FOOTER_WA_URL} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                Chat Admin
              </a>
            </Button>
            <p className="mt-3 text-xs text-white/40">{ADMIN_CONTACT.hours}</p>
          </div>

          <div className="lg:col-span-8">
            <div className="grid gap-8 sm:grid-cols-3">
              <FooterLinkGroup title="Jelajahi" links={MARKETING_FOOTER_EXPLORE} />
              <FooterLinkGroup title="Bantuan" links={MARKETING_FOOTER_SUPPORT} />
              <FooterLinkGroup title="Legal" links={MARKETING_FOOTER_LEGAL} />
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row">
          <p>© 2026 JepangKu. Semua hak dilindungi.</p>
          <p className="text-white/40">Bagian dari ekosistem JepangKu · kursus.jepangku.com</p>
        </div>
      </div>
    </footer>
  );
}
