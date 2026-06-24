import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AppStatusPageProps = {
  code: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function AppStatusPage({ code, title, description, action, className }: AppStatusPageProps) {
  return (
    <div
      className={cn(
        'flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center',
        className,
      )}
    >
      <Link href="/" className="mb-8 inline-block">
        <BrandLogo variant="nav" />
      </Link>
      <p className="text-6xl font-extrabold tracking-tight text-primary sm:text-7xl">{code}</p>
      <h1 className="mt-4 text-xl font-bold text-foreground sm:text-2xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
        {action ?? (
          <>
            <Button asChild>
              <Link href="/">Ke Beranda</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
