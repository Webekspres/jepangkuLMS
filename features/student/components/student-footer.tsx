import type { ComponentPropsWithoutRef } from 'react';

const YEAR = new Date().getFullYear();

function InstagramIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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

function YouTubeIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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

function TikTokIcon(props: ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
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

const SOCIAL_LINKS = [
  {
    href: 'https://www.instagram.com/jepangkunihongo/',
    label: 'Instagram',
    Icon: InstagramIcon,
  },
  {
    href: 'https://www.youtube.com/@jepangkuofficial',
    label: 'YouTube',
    Icon: YouTubeIcon,
  },
  {
    href: 'https://www.tiktok.com/@jepangkuofficial',
    label: 'TikTok',
    Icon: TikTokIcon,
  },
] as const;

/** Footer ringkas dasbor siswa — copyright kiri, sosmed kanan. */
export function StudentFooter() {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 md:px-8">
        <p className="text-xs text-muted-foreground sm:text-sm">
          © {YEAR} JepangKu. Semua hak dilindungi.
        </p>
        <ul className="flex items-center gap-1 sm:gap-2">
          {SOCIAL_LINKS.map(({ href, label, Icon }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <Icon className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
