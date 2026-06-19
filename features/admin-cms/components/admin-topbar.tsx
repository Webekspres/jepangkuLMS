'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Menu } from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAdminBreadcrumbs } from '@/features/admin-cms/lib/admin-nav';
import { AUTH_ROUTES } from '@/lib/auth/constants';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type AdminTopbarProps = {
  onMenuClick?: () => void;
};

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const breadcrumbs = getAdminBreadcrumbs(pathname);

  const displayName =
    user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? 'Admin';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={onMenuClick}
        aria-label="Buka menu navigasi"
      >
        <Menu className="size-5" />
      </Button>

      <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    isLast ? 'truncate font-medium text-foreground' : 'truncate text-muted-foreground'
                  }
                  aria-current={isLast ? 'page' : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </span>
          );
        })}
      </nav>

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex shrink-0 items-center gap-2 rounded-lg p-1 transition-opacity hover:opacity-80"
              aria-label="Menu pengguna"
            >
              <Avatar className="size-9 border border-border">
                <AvatarImage src={user.imageUrl} alt={displayName} />
                <AvatarFallback className="bg-brand-navy text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-muted-foreground">Admin CMS</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={AUTH_ROUTES.dashboard}>Dashboard Siswa</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void signOutFromApp(signOut).then(() => router.push('/'))}
            >
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </header>
  );
}
