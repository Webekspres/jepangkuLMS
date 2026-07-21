'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 200;

type StudentNavDropdownGroupProps = {
  group: StudentNavLinkGroup;
  pathname: string;
  active: boolean;
};

export function StudentNavDropdownGroup({
  group,
  pathname,
  active,
}: StudentNavDropdownGroupProps) {
  const [open, setOpen] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(() => {
    clearCloseTimer();
    clearOpenTimer();
    openTimerRef.current = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
  }, [clearCloseTimer, clearOpenTimer]);

  const scheduleClose = useCallback(() => {
    clearOpenTimer();
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  }, [clearCloseTimer, clearOpenTimer]);

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, [clearCloseTimer, clearOpenTimer]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger
        onPointerEnter={scheduleOpen}
        onPointerLeave={scheduleClose}
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
      <DropdownMenuContent
        align="start"
        sideOffset={10}
        onPointerEnter={scheduleOpen}
        onPointerLeave={scheduleClose}
        className="min-w-40 rounded-sm p-1"
      >
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
