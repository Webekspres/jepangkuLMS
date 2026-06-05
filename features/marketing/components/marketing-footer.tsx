import Image from 'next/image';
import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="bg-brand-navy px-4 py-12 text-white/60 md:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="inline-block">
            <Image
              src="/brand/logo-white.png"
              alt="JepangKu"
              width={150}
              height={40}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link href="/tentang" className="transition-colors hover:text-white">
              Tentang Kami
            </Link>
            <Link href="/kursus" className="transition-colors hover:text-white">
              Kursus
            </Link>
            <Link href="/tryout" className="transition-colors hover:text-white">
              JLPT Try Out
            </Link>
            <Link href="/hubungi" className="transition-colors hover:text-white">
              Kontak
            </Link>
          </div>
          <p className="text-sm">© 2026 JepangKu. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
