'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { ArrowLeft, LogOut } from 'lucide-react';
import { ADMIN_NAV_GROUPS } from '@/features/admin-cms/admin-nav-config';
import { ADMIN_ROUTES, AUTH_ROUTES } from '@/lib/auth/constants';
import { signOutFromApp } from '@/lib/auth/sign-out-client';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';

function isNavActive(pathname: string, href: string, matchPrefix?: boolean): boolean {
  if (href === pathname) return true;
  if (matchPrefix) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return false;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-sidebar-accent/20">
              <Link href={ADMIN_ROUTES.dashboard}>
                <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image
                    src="/brand/logo-white.png"
                    alt="JepangKu"
                    width={20}
                    height={20}
                    className="size-5 object-contain"
                  />
                </span>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-sidebar-foreground">JepangKu LMS</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Admin CMS</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {ADMIN_NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-sidebar-foreground/60">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isNavActive(pathname, item.href, item.matchPrefix)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Kembali ke dashboard siswa">
              <Link href={AUTH_ROUTES.dashboard}>
                <ArrowLeft />
                <span>Dashboard Siswa</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="bg-sidebar-border" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Keluar" onClick={() => void signOutFromApp(signOut)}>
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
