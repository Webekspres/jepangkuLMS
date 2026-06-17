'use client';

import { AdminBreadcrumb } from '@/features/admin-cms/components/admin-breadcrumb';
import { AdminSidebar } from '@/features/admin-cms/components/admin-sidebar';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:px-6">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AdminBreadcrumb />
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
