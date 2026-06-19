'use client';

/**
 * Notification Bell — mockup UI.
 * Siap dihubungkan ke sistem notifikasi real setelah model DB tersedia.
 */

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, BookOpen, Award, Video, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type MockNotification = {
  id: string;
  icon: typeof Bell;
  iconColor: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: '1',
    icon: Award,
    iconColor: 'text-brand-yellow',
    title: 'Badge baru diraih!',
    body: 'Kamu mendapatkan badge "Kilat Belajar" 🎉',
    time: '2 jam lalu',
    read: false,
  },
  {
    id: '2',
    icon: Video,
    iconColor: 'text-primary',
    title: 'Live class N3 segera dimulai',
    body: 'Live class N3 dimulai 30 menit lagi. Jangan sampai ketinggalan!',
    time: '30 mnt lalu',
    read: false,
  },
  {
    id: '3',
    icon: BookOpen,
    iconColor: 'text-emerald-500',
    title: 'Streak 14 hari! Pertahankan!',
    body: 'Kamu sudah belajar 14 hari berturut-turut. Hebat!',
    time: 'Baru saja',
    read: false,
  },
];

export function StudentNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const rootRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismiss(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Notifikasi${unreadCount > 0 ? ` (${unreadCount} baru)` : ''}`}
        className="relative flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* Notification list */}
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto mb-2 size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Tidak ada notifikasi baru.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      'group flex gap-3 px-4 py-3 transition-colors hover:bg-muted/30',
                      !notif.read && 'bg-primary/5',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted',
                      )}
                    >
                      <notif.icon className={cn('size-4', notif.iconColor)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{notif.time}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(notif.id)}
                      className="mt-0.5 shrink-0 rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      aria-label="Hapus notifikasi"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border px-4 py-2.5 text-center">
              <p className="text-[10px] text-muted-foreground">
                Riwayat notifikasi lengkap akan segera hadir.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
