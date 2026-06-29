'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Download,
  Loader2,
  Share2,
  X,
  Zap,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveAchievementBadgeRarity, type AchievementBadge } from './student-achievements-data';

// Custom SVG Icons for Social Media
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.97-1.861-1.868-4.339-2.897-6.97-2.899-5.437 0-9.862 4.369-9.866 9.802-.001 1.836.52 3.578 1.503 5.122L1.874 21.66l4.773-1.256zm13.514-6.32c-.066-.109-.242-.175-.506-.307-.264-.132-1.562-.77-1.804-.858-.242-.089-.418-.132-.594.132-.176.265-.682.858-.836 1.034-.154.176-.308.198-.572.066-.264-.132-1.117-.412-2.13-1.314-.787-.701-1.317-1.567-1.471-1.832-.154-.265-.016-.408.116-.539.118-.118.264-.308.396-.463.132-.154.176-.264.264-.44.089-.176.044-.331-.022-.463-.066-.132-.594-1.432-.814-1.961-.215-.518-.432-.447-.594-.456-.154-.008-.33-.01-.506-.01-.176 0-.462.066-.704.33-.242.264-.924.903-.924 2.199 0 1.296.946 2.543 1.078 2.719.132.176 1.861 2.842 4.508 3.982.63.272 1.122.434 1.505.556.633.201 1.21.173 1.666.105.508-.076 1.562-.638 1.782-1.254.22-.616.22-1.144.154-1.254z" />
    </svg>
  );
}

// Custom SVG Icon for X/Twitter
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Custom SVG Icon for Threads
function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.842 16.5c-.714 0-1.428-.214-2.142-.643-.5-.286-.928-.714-1.285-1.214-.5.714-1.143 1.214-1.928 1.571-.786.357-1.643.5-2.5.5-1.357 0-2.429-.429-3.214-1.286-.786-.857-1.214-2.071-1.214-3.571s.428-2.714 1.285-3.571c.857-.857 2-1.286 3.429-1.286 1.428 0 2.571.429 3.357 1.286.786.857 1.143 2 1.143 3.357 0 .5-.071 1-.143 1.429-.071.429-.214.857-.357 1.214-.143.357-.357.643-.643.857-.286.214-.571.286-.928.286-.357 0-.643-.071-.929-.286-.286-.214-.5-.5-.643-.857-.143-.357-.214-.786-.214-1.214s.071-.857.214-1.214c.143-.357.357-.643.643-.857s.571-.286.929-.286c.214 0 .429.071.643.143v-1.286c-.214-.071-.428-.143-.714-.143-.928 0-1.714.286-2.285.857-.572.571-.857 1.428-.857 2.5s.285 1.929.857 2.5c.571.571 1.286.857 2.143.857s1.571-.286 2.143-.857c.571-.571.857-1.428.857-2.5 0-.5 0-1-.071-1.5-.071-.5-.214-1-.357-1.429-.214-.429-.429-.857-.714-1.214-.286-.357-.714-.643-1.214-.786-.5-.143-1.071-.214-1.714-.214-1.643 0-3 .5-4.071 1.5S3.929 10.143 3.929 12s.5 3.5 1.5 4.5c1 .929 2.357 1.429 4.071 1.429.929 0 1.786-.143 2.571-.429.786-.286 1.429-.714 2-.1.214-.786.5-1.571.786-2.286.286-.714.5-1.429.643-2.143.143-.714.214-1.429.214-2.143 0-2.357-.643-4.214-1.929-5.5C14.429.643 12.357 0 9.857 0 7.143 0 4.857.714 3.071 2.143 1.286 3.571.357 5.5.357 8c0 2.357.786 4.286 2.357 5.714C4.286 15.143 6.357 16 9 16c.857 0 1.714-.071 2.571-.214.857-.143 1.643-.357 2.357-.643z" />
    </svg>
  );
}

// Custom SVG Icon for Facebook
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

type BadgeShareModalProps = {
  badge: AchievementBadge | null;
  onClose: () => void;
  userDisplayName: string;
  userAvatarUrl: string | null;
  userLevel: number;
  onEquip?: (badgeId: string) => void;
  isEquipping?: boolean;
};

export function BadgeShareModal({
  badge,
  onClose,
  userDisplayName,
  userAvatarUrl,
  userLevel,
  onEquip,
  isEquipping = false,
}: BadgeShareModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!badge) return null;

  const rarityLabel = resolveAchievementBadgeRarity(badge.rarity);

  // Rarity styling for glow and accents (theme-aware)
  const rarityGlows: Record<string, string> = {
    Common: 'from-slate-500/20 dark:from-slate-400/20 to-transparent shadow-slate-500/10',
    Rare: 'from-blue-500/20 dark:from-blue-400/25 to-transparent shadow-blue-500/10',
    Epic: 'from-purple-500/25 dark:from-purple-400/30 to-transparent shadow-purple-500/15',
    Legendary: 'from-amber-500/30 dark:from-amber-400/35 to-transparent shadow-amber-500/20',
  };

  const rarityTextColors: Record<string, string> = {
    Common: 'text-slate-500 dark:text-slate-400',
    Rare: 'text-blue-600 dark:text-blue-400',
    Epic: 'text-purple-600 dark:text-purple-400',
    Legendary: 'text-amber-600 dark:text-amber-400',
  };

  const glowClass = rarityGlows[rarityLabel] || rarityGlows.Common;
  const textColorClass = rarityTextColors[rarityLabel] || rarityTextColors.Common;

  // Share template
  const shareText = `Wah, saya baru saja mendapatkan Badge '${badge.name}' di JepangKu LMS setelah ${badge.requirementText || badge.desc}! Yuk ikut belajar bahasa Jepang terstruktur dari N5-N1 bersama saya di jepangku.com 🌸🏅`;
  const lmsUrl = 'https://kursus.jepangku.com';
  
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(lmsUrl)}`;
  const threadsUrl = `https://threads.net/intent/post?text=${encodeURIComponent(shareText + ' ' + lmsUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(lmsUrl)}&quote=${encodeURIComponent(shareText)}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Badge diraih: ${badge.name}`,
          text: shareText,
          url: lmsUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    setDownloadError(null);

    try {
      const node = cardRef.current;
      
      // html-to-image capture options
      const dataUrl = await htmlToImage.toPng(node, {
        width: 1080,
        height: 1920,
        cacheBust: true,
      });

      // Trigger download
      const link = document.createElement('a');
      link.download = `jepangku-badge-${badge.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image:', err);
      setDownloadError('Gagal menyimpan gambar. Silakan coba kembali.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card/95 p-6 text-center text-foreground shadow-2xl backdrop-blur-md"
          >
            {/* Background Glow Effect */}
            <div className={cn(
              "absolute -left-1/4 -top-1/4 -z-10 size-96 rounded-full bg-gradient-to-br blur-[90px] opacity-40 dark:opacity-35 animate-pulse",
              glowClass
            )} />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Tutup"
            >
              <X className="size-5" />
            </button>

            {/* Header / Celebration Title */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-1"
            >
              <span className={cn("text-xs font-black uppercase tracking-widest", textColorClass)}>
                Pencapaian Baru Diraih!
              </span>
            </motion.div>

            {/* Large Badge Graphic with Glow */}
            <div className="relative my-6 flex justify-center">
              {/* Inner Pulsing Ring */}
              <div className="absolute inset-0 m-auto size-32 rounded-full bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 blur-md animate-ping" />
              
              <motion.div
                initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
                className={cn(
                  "relative z-10 flex size-36 items-center justify-center overflow-hidden rounded-3xl border-2 bg-slate-950 shadow-2xl transition-all",
                  rarityLabel === 'Legendary' ? 'border-amber-400' :
                  rarityLabel === 'Epic' ? 'border-purple-400' :
                  rarityLabel === 'Rare' ? 'border-blue-400' : 'border-slate-500'
                )}
              >
                {badge.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={badge.imageUrl} alt={badge.name} className="size-full object-cover" />
                ) : (
                  <span className="text-6xl">{badge.icon}</span>
                )}
              </motion.div>
            </div>

            {/* Badge Title & Description */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider border border-border">
                🏅 {rarityLabel}
              </span>
              <h3 className="text-2xl font-black tracking-tight text-foreground">{badge.name}</h3>
              <p className="text-xs text-muted-foreground">
                Berhasil diraih pada {badge.date || 'Juni 2026'}
              </p>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-foreground bg-muted/50 rounded-xl p-3 border border-border/50">
                {badge.requirementText || badge.desc}
              </p>
            </div>

            {/* XP Bonus Indicator */}
            {badge.xp > 0 && (
              <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-black text-amber-600 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 w-max mx-auto">
                <Zap className="size-3 fill-amber-500 dark:fill-amber-300" />
                +{badge.xp} XP BONUS
              </div>
            )}

            {/* Sharing Section */}
            <div className="mt-6 border-t border-border pt-5 space-y-4">
              <p className="text-xs font-bold text-muted-foreground tracking-wide uppercase">Bagikan Ke Sosial Media</p>
              
              {/* Social Buttons Grid */}
              <div className="grid grid-cols-4 gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 p-3 text-foreground transition-all group"
                >
                  <WhatsAppIcon className="size-5 text-[#25D366] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">WA</span>
                </a>

                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border p-3 text-foreground transition-all group"
                >
                  <XIcon className="size-5 text-foreground group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">X</span>
                </a>

                <a
                  href={threadsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border p-3 text-foreground transition-all group"
                >
                  <ThreadsIcon className="size-5 text-foreground group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Threads</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 p-3 text-foreground transition-all group"
                >
                  <FacebookIcon className="size-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Facebook</span>
                </a>
              </div>

              {/* Action Buttons: Native Share, Download Card, Equip Title */}
              <div className="flex flex-col gap-2 pt-1">
                {typeof navigator !== 'undefined' && navigator.share && (
                  <Button
                    onClick={handleNativeShare}
                    variant="outline"
                    className="w-full gap-2 border-border bg-muted/30 text-foreground hover:bg-muted/50 rounded-2xl"
                  >
                    <Share2 className="size-4" />
                    Bagikan Lainnya (Sistem)
                  </Button>
                )}

                <Button
                  onClick={handleDownloadCard}
                  disabled={isDownloading}
                  className="w-full gap-2 bg-gradient-to-r from-brand-red to-brand-orange text-white hover:brightness-110 rounded-2xl font-bold"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Membuat Gambar...
                    </>
                  ) : (
                    <>
                      <Download className="size-4" />
                      Simpan Kartu (IG Story / Foto)
                    </>
                  )}
                </Button>

                {downloadError && (
                  <p className="text-xs text-destructive mt-1">{downloadError}</p>
                )}

                {/* Equip Title Action */}
                {onEquip && (
                  <div className="mt-2 border-t border-border pt-3">
                    {!badge.isEquipped ? (
                      <Button
                        variant="ghost"
                        className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl py-1"
                        disabled={isEquipping}
                        onClick={() => onEquip(badge.id)}
                      >
                        Pasang badge sebagai Title Profil
                      </Button>
                    ) : (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Aktif sebagai Title Profil Anda</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Hidden 1080 x 1920 Instagram Story Card for html-to-image Capture */}
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '1080px',
          height: '1920px',
          display: 'flex',
        }}
        className="z-[-50] flex-col items-center justify-between bg-[#1E1B57] p-16 text-white"
      >
        {/* Abstract Background Accents */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(236,29,36,0.15),transparent_50%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_60%,rgba(248,231,28,0.08),transparent_50%)]" />
        
        {/* Subtle Diagonal Lines / Grid */}
        <div className="absolute inset-0 -z-10 opacity-5 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Top Section - Brand Header */}
        <div className="flex flex-col items-center gap-4 text-center mt-8">
          <div className="flex items-center gap-3">
            {/* Logo Watermark */}
            <span className="text-3xl font-black tracking-wider text-white">JEPANGKU</span>
            <span className="rounded-lg bg-[#EC1D24] px-3 py-1 text-sm font-black uppercase tracking-widest text-white">LMS</span>
          </div>
          <div className="h-1.5 w-24 rounded-full bg-gradient-to-r from-[#EC1D24] via-[#FF4B2B] to-[#F8E71C]" />
        </div>

        {/* Middle Section - Badge Celebration */}
        <div className="flex flex-col items-center gap-10 text-center max-w-[800px]">
          {/* Celebrating Label */}
          <span className="rounded-full bg-white/10 px-6 py-2 text-lg font-bold uppercase tracking-widest text-white/70 backdrop-blur-md border border-white/10">
            Pencapaian Baru Dibuka!
          </span>

          {/* Large Badge Graphic */}
          <div className="relative flex size-80 items-center justify-center rounded-[60px] border-4 border-white/20 bg-slate-950 p-6 shadow-2xl shadow-black/80">
            {/* Rarity Ring Glow */}
            <div className={cn(
              "absolute inset-0 -z-10 rounded-[60px] blur-3xl opacity-65 scale-110",
              rarityLabel === 'Legendary' ? 'bg-amber-400' :
              rarityLabel === 'Epic' ? 'bg-purple-500' :
              rarityLabel === 'Rare' ? 'bg-blue-500' : 'bg-slate-500'
            )} />
            
            {badge.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={badge.imageUrl}
                alt=""
                crossOrigin="anonymous"
                className="size-full object-cover rounded-[48px]"
              />
            ) : (
              <span className="text-9xl">{badge.icon}</span>
            )}
          </div>

          {/* Badge Info */}
          <div className="space-y-4">
            <span className={cn(
              "text-2xl font-black uppercase tracking-widest",
              textColorClass
            )}>
              {rarityLabel} BADGE
            </span>
            <h2 className="text-6xl font-black tracking-tight text-white leading-none">{badge.name}</h2>
            <div className="h-0.5 w-16 bg-white/20 mx-auto" />
            <p className="text-2xl font-medium leading-relaxed text-white/90 bg-white/5 rounded-3xl py-6 px-10 border border-white/10 shadow-inner">
              {badge.requirementText || badge.desc}
            </p>
          </div>
        </div>

        {/* Bottom Section - User Profile and QR/Call-to-Action */}
        <div className="flex w-full items-center justify-between border-t border-white/10 pt-10 mb-8">
          {/* User Profile */}
          <div className="flex items-center gap-5">
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatarUrl}
                alt=""
                crossOrigin="anonymous"
                className="size-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold border-2 border-white/20 shadow-lg">
                {userDisplayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <p className="text-2xl font-black text-white">{userDisplayName}</p>
              <p className="text-sm text-white/50 font-semibold tracking-wider uppercase">Siswa JepangKu · Level {userLevel}</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-right">
            <p className="text-xl font-bold text-white/90">Belajar Bahasa Jepang</p>
            <p className="text-sm text-[#EC1D24] font-black tracking-widest uppercase">kursus.jepangku.com</p>
          </div>
        </div>
      </div>
    </>
  );
}
