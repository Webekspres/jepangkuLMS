'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/features/admin-cms/components/admin-sidebar';
import { AdminTopbar } from '@/features/admin-cms/components/admin-topbar';
import { cn } from '@/lib/utils';

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <AdminSidebar className="hidden lg:flex" />

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
          />
          <AdminSidebar
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
            onNavigate={() => setMobileOpen(false)}
          />
        </>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setMobileOpen(true)} />
        <main className={cn('flex-1 overflow-y-auto')}>{children}</main>
      </div>
    </div>
  );
}
