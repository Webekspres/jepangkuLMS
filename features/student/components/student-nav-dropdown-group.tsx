'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StudentNavLinkGroup } from '@/features/student/components/student-nav-links';
import { isStudentNavHrefActive } from '@/features/student/components/student-nav-links';
import { cn } from '@/lib/utils';

type StudentNavDropdownGroupProps = {
  group: StudentNavLinkGroup;
  pathname: string;
  active: boolean;
};

/** Submenu Program desktop — buka/tutup lewat klik (bukan hover). */
export function StudentNavDropdownGroup({
  group,
  pathname,
  active,
}: StudentNavDropdownGroupProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(
          'group relative inline-flex items-center gap-1 py-1 text-sm font-medium transition-colors duration-300 outline-none',
          active
            ? 'font-semibold text-primary'
            : 'text-muted-foreground hover:text-primary data-[state=open]:text-primary',
        )}
      >
        {group.label}
        <ChevronDown className="size-3.5 opacity-70 transition-transform group-data-[state=open]:rotate-180" />
        <span
          aria-hidden
          className={cn(
            'absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-primary transition-transform duration-300 ease-out',
            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 group-data-[state=open]:scale-x-100',
          )}
          style={{ transformOrigin: 'center bottom' }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10} className="min-w-40 rounded-sm p-1">
        {group.children.map((child) => {
          const childActive = isStudentNavHrefActive(pathname, child.href);
          return (
            <DropdownMenuItem key={child.href} asChild className="rounded-sm">
              <Link
                href={child.href}
                className={cn(childActive && 'bg-primary/10 font-semibold text-primary')}
              >
                {child.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
