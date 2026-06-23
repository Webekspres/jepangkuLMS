import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ADMIN_CONTENT_CLASS } from '@/features/admin-cms/lib/admin-layout';
import { cn } from '@/lib/utils';

type AdminPageShellProps = {
  title: string;
  subtitle?: string;
  label?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function AdminPageShell({
  title,
  subtitle,
  label,
  backHref,
  backLabel = 'Kembali',
  action,
  children,
  className,
}: AdminPageShellProps) {
  return (
    <div className={cn('min-h-full bg-background', className)}>
      <section className="border-b border-border bg-muted/40">
        <div className={`${ADMIN_CONTENT_CLASS} py-8`}>
          {backHref ? (
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-brand-red"
            >
              <ArrowLeft className="size-3.5" />
              {backLabel}
            </Link>
          ) : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              {label ? (
                <p className="text-xs font-bold uppercase tracking-wider text-brand-red">{label}</p>
              ) : null}
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {title}
              </h1>
              {subtitle ? <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </div>
        </div>
      </section>
      <div className={`${ADMIN_CONTENT_CLASS} py-8`}>{children}</div>
    </div>
  );
}
