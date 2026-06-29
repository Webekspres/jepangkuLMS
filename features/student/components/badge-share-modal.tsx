'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Download,
  Globe,
  Hash,
  Loader2,
  MessageSquare,
  Share2,
  X,
  Zap,
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
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

  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

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
        cacheBust: true,
        width: 1080,
        height: 1920,
        backgroundColor: '#1E1B57',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '1080px',
          height: '1920px',
          backgroundColor: '#1E1B57',
        },
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
                  <MessageSquare className="size-5 text-[#25D366] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">WA</span>
                </a>

                <a
                  href={xUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border p-3 text-foreground transition-all group"
                >
                  <X className="size-5 text-foreground group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">X</span>
                </a>

                <a
                  href={threadsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-muted hover:bg-muted/80 border border-border p-3 text-foreground transition-all group"
                >
                  <Hash className="size-5 text-foreground group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Threads</span>
                </a>

                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 p-3 text-foreground transition-all group"
                >
                  <Globe className="size-5 text-[#1877F2] group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">Facebook</span>
                </a>
              </div>

              {/* Action Buttons: Native Share, Download Card, Equip Title */}
              <div className="flex flex-col gap-3 pt-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  {canNativeShare ? (
                    <Button
                      onClick={handleNativeShare}
                      variant="outline"
                      className="w-full gap-2 rounded-2xl border-border bg-muted/30 text-foreground hover:bg-muted/50"
                    >
                      <Share2 className="size-4" />
                      Bagikan Lainnya
                    </Button>
                  ) : (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full gap-2 rounded-2xl border-border bg-muted/30 text-foreground hover:bg-muted/50"
                    >
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        <Share2 className="size-4" />
                        Bagikan Lainnya
                      </a>
                    </Button>
                  )}

                  <Button
                    onClick={handleDownloadCard}
                    disabled={isDownloading}
                    variant="outline"
                    className="w-full gap-2 rounded-2xl border-border bg-muted/30 text-foreground hover:bg-muted/50"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Membuat Gambar...
                      </>
                    ) : (
                      <>
                        <Download className="size-4" />
                        Simpan gambar
                      </>
                    )}
                  </Button>
                </div>

                {downloadError && (
                  <p className="text-xs text-destructive mt-1">{downloadError}</p>
                )}

                {/* Equip Title Action */}
                {onEquip && (
                  <div className="mt-1">
                    {!badge.isEquipped ? (
                      <Button
                        variant="default"
                        className="w-full gap-2 py-3 text-sm font-semibold"
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
          top: '0px',
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
