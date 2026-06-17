'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { ArrowLeft, LogOut, Search } from 'lucide-react';
import { ADMIN_NAV_GROUPS, getActiveAdminNavHref } from '@/features/admin-cms/admin-nav-config';
import { ADMIN_ROUTES, AUTH_ROUTES } from '@/lib/auth/constants';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AdminSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

function filterNavGroups(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return ADMIN_NAV_GROUPS;

  return ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
  })).filter((group) => group.items.length > 0);
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [search, setSearch] = useState('');
  const filteredGroups = useMemo(() => filterNavGroups(search), [search]);
  const activeHref = useMemo(() => getActiveAdminNavHref(pathname), [pathname]);

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="flex shrink-0 flex-col items-center justify-center border-b border-sidebar-border px-4 py-5">
        <Link href={ADMIN_ROUTES.dashboard} className="flex items-center gap-3" onClick={onNavigate}>
          <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Image
              src="/brand/logo-white.png"
              alt="JepangKu"
              width={24}
              height={24}
              className="size-6 object-contain"
            />
          </span>
          <div className="text-left">
            <p className="text-sm font-bold text-sidebar-foreground">JepangKu LMS</p>
            <p className="text-xs text-sidebar-foreground/70">Admin CMS</p>
          </div>
        </Link>
      </div>

      <div className="shrink-0 px-3 py-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sidebar-foreground/50" />
          <Input
            type="search"
            placeholder="Cari menu..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 border-sidebar-border bg-sidebar-accent/30 pl-9 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Navigasi admin">
        {filteredGroups.length === 0 ? (
          <p className="px-3 py-2 text-sm text-sidebar-foreground/60">Menu tidak ditemukan.</p>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="mb-5 last:mb-0">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = !item.comingSoon && item.href === activeHref;

                  if (item.comingSoon) {
                    return (
                      <li key={item.id}>
                        <span className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/40">
                          <Icon className="size-[18px] shrink-0" strokeWidth={1.5} />
                          <span className="truncate">{item.label}</span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors',
                          active
                            ? 'bg-sidebar-primary/15 font-medium text-sidebar-primary'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
                        )}
                      >
                        <Icon className="size-[18px] shrink-0" strokeWidth={1.5} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-sidebar-border p-3">
        <Link
          href={AUTH_ROUTES.dashboard}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/40"
        >
          <ArrowLeft className="size-4" />
          Dashboard Siswa
        </Link>
        <button
          type="button"
          onClick={() => void signOutFromApp(signOut)}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/40"
        >
          <LogOut className="size-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
