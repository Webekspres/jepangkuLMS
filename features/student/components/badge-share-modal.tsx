'use client';

import { AnimatePresence, motion } from 'motion/react';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveAchievementBadgeRarity, type AchievementBadge } from './student-achievements-data';

type BadgeShareModalProps = {
  badge: AchievementBadge | null;
  onClose: () => void;
  userDisplayName: string;
  userAvatarUrl: string | null;
  userLevel: number;
  onEquip?: (badgeId: string) => void;
  isEquipping?: boolean;
};

const LMS_SHARE_URL = 'https://kursus.jepangku.com';

function BrandIcon({
  className,
  children,
  label,
}: {
  className?: string;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn('size-5', className)}
    >
      <title>{label}</title>
      {children}
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <BrandIcon className={className} label="WhatsApp">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </BrandIcon>
  );
}

function XBrandIcon({ className }: { className?: string }) {
  return (
    <BrandIcon className={className} label="X">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.227-8.451L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </BrandIcon>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <BrandIcon className={className} label="Threads">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.23-8.184-3.574C2.35 18.491 1.5 15.73 1.5 12.18v-.012C1.512 4.98 5.445 1.02 12.185 1h.014c3.313.01 5.837.924 7.505 2.717C21.21 5.338 22.012 7.83 22.012 11.08c0 .12-.001.241-.005.361-.147 4.704-2.588 7.566-7.256 8.516-.5.102-1.012.16-1.564.178v-3.015c.348-.01.67-.036.96-.076 2.438-.34 3.888-1.852 3.995-4.72.005-.08.01-.16.01-.24 0-2.142-.54-3.697-1.705-4.902-1.181-1.224-2.937-1.84-5.218-1.84h-.012c-3.646.008-6.162 2.296-6.27 5.72-.004.11-.007.22-.007.332 0 2.814 1.73 4.693 4.335 4.957.444.046.907.057 1.366.034v-2.98c-.268.02-.54.016-.8-.014-1.08-.12-1.77-.84-1.77-1.92 0-.1.005-.2.016-.298.104-.93.86-1.62 1.934-1.736.23-.025.464-.03.693-.014 1.02.07 1.64.68 1.64 1.64 0 .086-.006.172-.017.256-.057.44-.172.84-.344 1.19-.286.576-.72 1.064-1.29 1.454-.55.376-1.2.656-1.944.834-.32.076-.66.128-1.012.152v3.014c.44-.02.866-.07 1.276-.147 1.56-.29 2.9-.89 3.98-1.786 1.36-1.13 2.24-2.63 2.61-4.47.12-.58.18-1.19.18-1.81 0-2.5-.6-4.42-1.79-5.72-1.28-1.4-3.24-2.11-5.85-2.12h-.02C7.72 3.99 4.48 6.98 4.47 12.17v.014c0 2.87.66 5.12 1.96 6.72 1.42 1.74 3.64 2.66 6.73 2.68h.014c.72-.004 1.41-.06 2.05-.164v-3.014c-.48.09-.98.14-1.5.15z" />
    </BrandIcon>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <BrandIcon className={className} label="Facebook">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </BrandIcon>
  );
}

function buildShareText(input: {
  badgeName: string;
  requirement: string;
  userDisplayName: string;
  userLevel: number;
}): string {
  return [
    `🏅 Saya baru meraih badge "${input.badgeName}" di JepangKu LMS!`,
    `Syarat: ${input.requirement}`,
    `Siswa: ${input.userDisplayName} · Level ${input.userLevel}`,
    'Yuk belajar bahasa Jepang N5–N1 bareng di JepangKu 🌸',
  ].join('\n');
}

export function BadgeShareModal({
  badge,
  onClose,
  userDisplayName,
  userLevel,
  onEquip,
  isEquipping = false,
}: BadgeShareModalProps) {
  if (!badge) return null;

  const rarityLabel = resolveAchievementBadgeRarity(badge.rarity);

  const rarityGlows: Record<string, string> = {
    Common: 'from-slate-500/20  to-transparent shadow-slate-500/10',
    Rare: 'from-blue-500/20  to-transparent shadow-blue-500/10',
    Epic: 'from-purple-500/25  to-transparent shadow-purple-500/15',
    Legendary: 'from-amber-500/30  to-transparent shadow-amber-500/20',
  };

  const rarityTextColors: Record<string, string> = {
    Common: 'text-slate-500 ',
    Rare: 'text-blue-600 ',
    Epic: 'text-purple-600 ',
    Legendary: 'text-amber-600 ',
  };

  const glowClass = rarityGlows[rarityLabel] || rarityGlows.Common;
  const textColorClass = rarityTextColors[rarityLabel] || rarityTextColors.Common;

  const requirement = badge.requirementText || badge.desc;
  const shareText = buildShareText({
    badgeName: badge.name,
    requirement,
    userDisplayName,
    userLevel,
  });

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${LMS_SHARE_URL}`)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(LMS_SHARE_URL)}`;
  const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText}\n${LMS_SHARE_URL}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(LMS_SHARE_URL)}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card/95 px-5 py-4 text-center text-foreground shadow-2xl backdrop-blur-md"
        >
          <div
            className={cn(
              'absolute -left-1/4 -top-1/4 -z-10 size-64 rounded-full bg-linear-to-br opacity-40 blur-[70px] animate-pulse ',
              glowClass,
            )}
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Tutup"
          >
            <X className="size-4" />
          </button>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-2"
          >
            <span className={cn('text-[10px] font-black tracking-widest uppercase', textColorClass)}>
              Pencapaian Baru Diraih!
            </span>
          </motion.div>

          <div className="relative mb-3 flex justify-center">
            <motion.div
              initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
              className={cn(
                'relative z-10 flex size-24 items-center justify-center overflow-hidden rounded-2xl border-2 bg-slate-950 shadow-lg',
                rarityLabel === 'Legendary'
                  ? 'border-amber-400'
                  : rarityLabel === 'Epic'
                    ? 'border-purple-400'
                    : rarityLabel === 'Rare'
                      ? 'border-blue-400'
                      : 'border-slate-500',
              )}
            >
              {badge.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badge.imageUrl} alt={badge.name} className="size-full object-cover" />
              ) : (
                <span className="text-4xl">{badge.icon}</span>
              )}
            </motion.div>
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
              🏅 {rarityLabel}
            </span>
            <h3 className="text-lg font-black tracking-tight text-foreground">{badge.name}</h3>
            <p className="text-[11px] text-muted-foreground">
              Berhasil diraih pada {badge.date || 'Juni 2026'}
            </p>
            <p className="mx-auto max-w-sm rounded-lg border border-border/50 bg-muted/50 px-3 py-2 text-xs leading-snug text-foreground">
              {requirement}
            </p>
          </div>

          {badge.xp > 0 ? (
            <div className="mx-auto mt-2 flex w-max items-center justify-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-600 ">
              <Zap className="size-3 fill-amber-500 " />+{badge.xp} XP BONUS
            </div>
          ) : null}

          <div className="mt-3 space-y-2.5 border-t border-border pt-3">
            <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
              Bagikan Ke Sosial Media
            </p>

            <div className="grid grid-cols-4 gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-[#25D366]/20 bg-[#25D366]/10 p-2 text-foreground transition-all hover:bg-[#25D366]/20"
              >
                <WhatsAppIcon className="size-4 text-[#25D366] transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-bold">WA</span>
              </a>

              <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted p-2 text-foreground transition-all hover:bg-muted/80"
              >
                <XBrandIcon className="size-4 text-foreground transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-bold">X</span>
              </a>

              <a
                href={threadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-border bg-muted p-2 text-foreground transition-all hover:bg-muted/80"
              >
                <ThreadsIcon className="size-4 text-foreground transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-bold">Threads</span>
              </a>

              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-[#1877F2]/20 bg-[#1877F2]/10 p-2 text-foreground transition-all hover:bg-[#1877F2]/20"
              >
                <FacebookIcon className="size-4 text-[#1877F2] transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-bold">FB</span>
              </a>
            </div>

            {onEquip ? (
              <div>
                {!badge.isEquipped ? (
                  <Button
                    type="button"
                    variant="default"
                    className="h-9 w-full gap-2 text-xs font-semibold"
                    disabled={isEquipping}
                    onClick={() => onEquip(badge.id)}
                  >
                    Pasang badge sebagai Title Profil
                  </Button>
                ) : (
                  <p className="text-[11px] font-semibold text-emerald-600 ">
                    ✓ Aktif sebagai Title Profil Anda
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
