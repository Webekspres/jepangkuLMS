'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  Bell,
  BookOpen,
  Receipt,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { LmsNotificationType } from '@prisma/client';
import {
  deleteReadNotificationsAction,
  dismissNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/features/notifications/actions/notification-actions';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type NotificationItem = {
  id: string;
  type: LmsNotificationType;
  title: string;
  body: string | null;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
};

const TYPE_ICONS: Record<LmsNotificationType, { icon: LucideIcon; color: string }> = {
  ENROLLMENT_PENDING: { icon: Receipt, color: 'text-amber-500' },
  ENROLLMENT_APPROVED: { icon: BookOpen, color: 'text-emerald-500' },
  ENROLLMENT_REJECTED: { icon: BookOpen, color: 'text-muted-foreground' },
  BADGE_UNLOCKED: { icon: Award, color: 'text-brand-yellow' },
  XP_EARNED: { icon: Trophy, color: 'text-primary' },
  COURSE_GRANTED: { icon: BookOpen, color: 'text-primary' },
};

// ── TanStack Query keys ───────────────────────────────────────────────────────

export const NOTIF_KEYS = {
  unreadCount: ['notifications', 'unread-count'] as const,
  list: ['notifications', 'list'] as const,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date | string): string {
  const value = new Date(date);
  const diffMs = Date.now() - value.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Kemarin';
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return value.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' });
  if (!res.ok) return 0;
  const data = (await res.json()) as { count: number };
  return data.count;
}

async function fetchNotificationList(): Promise<NotificationItem[]> {
  const res = await fetch('/api/notifications', { cache: 'no-store' });
  if (!res.ok) return [];
  const data = (await res.json()) as { items: NotificationItem[] };
  return data.items;
}

/** Legacy href stored before route was standardized to /dashboard/achievements. */
function normalizeNotificationHref(href: string | null): string | null {
  if (href === '/dashboard/pencapaian') return STUDENT_ROUTES.achievements;
  return href;
}

// ── Props ─────────────────────────────────────────────────────────────────────

type NotificationBellProps = {
  className?: string;
  buttonClassName?: string;
  footerHref?: string;
  footerLabel?: string;
  /** 'navigate' → footer link; 'clear-read' → tombol hapus notifikasi terbaca. */
  footerMode?: 'navigate' | 'clear-read';
};

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationBell({
  className,
  buttonClassName,
  footerHref = '/dashboard',
  footerLabel = 'Buka dashboard',
  footerMode = 'navigate',
}: NotificationBellProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  // ── Query 1: Eager unread COUNT — fetches on mount, no dropdown needed ──
  const { data: unreadCount = 0 } = useQuery({
    queryKey: NOTIF_KEYS.unreadCount,
    queryFn: fetchUnreadCount,
    // Refresh badge every 60 s while tab is active
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    staleTime: 30_000,
  });

  // ── Query 2: Lazy notification LIST — only fetches when dropdown is open ──
  const { data: notifications = [], isFetching: loading } = useQuery({
    queryKey: NOTIF_KEYS.list,
    queryFn: fetchNotificationList,
    enabled: open,
    staleTime: 15_000,
  });

  const readCount = notifications.filter((item) => item.readAt).length;
  // Prefer live unread count from badge query so badge is always accurate
  const liveUnreadCount = open
    ? notifications.filter((item) => !item.readAt).length
    : unreadCount;

  // ── Close on outside click / Escape ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  // ── Sync badge count after list loads so it stays accurate ───────────────
  useEffect(() => {
    if (!open || loading || notifications.length === 0) return;
    const freshCount = notifications.filter((item) => !item.readAt).length;
    queryClient.setQueryData(NOTIF_KEYS.unreadCount, freshCount);
  }, [open, loading, notifications, queryClient]);

  // ── Actions ───────────────────────────────────────────────────────────────

  function handleToggle() {
    setOpen((prev) => !prev);
  }

  function markAllRead() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      // Optimistic update — list
      queryClient.setQueryData(NOTIF_KEYS.list, (prev: NotificationItem[] = []) =>
        prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date() })),
      );
      // Badge → 0
      queryClient.setQueryData(NOTIF_KEYS.unreadCount, 0);
    });
  }

  function handleOpenItem(item: NotificationItem) {
    startTransition(async () => {
      if (!item.readAt) {
        await markNotificationReadAction(item.id);
        queryClient.setQueryData(NOTIF_KEYS.list, (prev: NotificationItem[] = []) =>
          prev.map((row) => (row.id === item.id ? { ...row, readAt: new Date() } : row)),
        );
        queryClient.setQueryData(NOTIF_KEYS.unreadCount, (prev: number = 0) =>
          Math.max(0, prev - 1),
        );
      }
      if (item.href) {
        setOpen(false);
        router.push(normalizeNotificationHref(item.href)!);
      }
    });
  }

  function dismiss(id: string) {
    startTransition(async () => {
      await dismissNotificationAction(id);
      queryClient.setQueryData(NOTIF_KEYS.list, (prev: NotificationItem[] = []) => {
        const removed = prev.find((item) => item.id === id);
        const next = prev.filter((item) => item.id !== id);
        // Adjust badge count if the dismissed item was unread
        if (removed && !removed.readAt) {
          queryClient.setQueryData(NOTIF_KEYS.unreadCount, (c: number = 0) =>
            Math.max(0, c - 1),
          );
        }
        return next;
      });
    });
  }

  function clearRead() {
    startTransition(async () => {
      await deleteReadNotificationsAction();
      queryClient.setQueryData(NOTIF_KEYS.list, (prev: NotificationItem[] = []) =>
        prev.filter((item) => !item.readAt),
      );
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-label={`Notifikasi${liveUnreadCount > 0 ? ` (${liveUnreadCount} baru)` : ''}`}
        className={cn(
          'relative flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
          buttonClassName,
        )}
      >
        <Bell className="size-4" />
        {liveUnreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {liveUnreadCount > 9 ? '9+' : liveUnreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Notifikasi</span>
                {liveUnreadCount > 0 ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {liveUnreadCount} baru
                  </span>
                ) : null}
              </div>
              {liveUnreadCount > 0 ? (
                <button
                  type="button"
                  onClick={markAllRead}
                  disabled={isPending}
                  className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                >
                  Tandai semua dibaca
                </button>
              ) : null}
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">Memuat…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Tidak ada notifikasi baru.</p>
              </div>
            ) : (
              <div className="max-h-80 divide-y divide-border overflow-y-auto">
                {notifications.map((item) => {
                  const meta = TYPE_ICONS[item.type] ?? TYPE_ICONS.XP_EARNED;
                  const Icon = meta.icon;
                  const content = (
                    <>
                      <div
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted',
                        )}
                      >
                        <Icon className={cn('size-4', meta.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground">{item.title}</p>
                        {item.body ? (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                            {item.body}
                          </p>
                        ) : null}
                        <p className="mt-1 text-[10px] text-muted-foreground/70">
                          {formatRelativeTime(item.createdAt)}
                        </p>
                      </div>
                    </>
                  );

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
                        !item.readAt && 'bg-primary/5',
                      )}
                    >
                      {item.href ? (
                        <button
                          type="button"
                          onClick={() => handleOpenItem(item)}
                          className="flex min-w-0 flex-1 gap-3 text-left"
                        >
                          {content}
                        </button>
                      ) : (
                        <div className="flex min-w-0 flex-1 gap-3">{content}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => dismiss(item.id)}
                        disabled={isPending}
                        className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                        aria-label="Hapus notifikasi"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {footerMode === 'clear-read'
              ? notifications.length > 0 && (
                  <div className="border-t border-border px-4 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={clearRead}
                      disabled={isPending || readCount === 0}
                      className="cursor-pointer text-[10px] font-semibold text-destructive transition-colors hover:underline underline-offset-4 disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                    >
                      Hapus semua
                    </button>
                  </div>
                )
              : (
                  <div className="border-t border-border px-4 py-2.5 text-center">
                    <Link
                      href={footerHref}
                      onClick={() => setOpen(false)}
                      className="text-[10px] font-semibold text-primary hover:underline underline-offset-4"
                    >
                      {footerLabel}
                    </Link>
                  </div>
                )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
