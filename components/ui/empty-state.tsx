import Image from 'next/image';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type EmptyStateProps = {
  /** Judul utama — singkat & ramah, bukan pesan error. */
  title: string;
  /** Deskripsi pendukung opsional. */
  description?: string;
  /** Tombol / CTA opsional (mis. "Jelajahi kursus"). */
  action?: ReactNode;
  /** Override sumber gambar maskot. Default: maskot "tidak ditemukan" JepangKu. */
  imageSrc?: string;
  className?: string;
};

/**
 * Empty state ramah dengan maskot JepangKu — dipakai untuk daftar/data kosong
 * ("Belum ada kursus", "Tidak ada enrollment", dst). Sengaja terlihat
 * mengundang, bukan seperti halaman error.
 */
export function EmptyState({
  title,
  description,
  action,
  imageSrc = '/assets/not-found.webp',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-12 text-center sm:py-16',
        className,
      )}
    >
      <Image
        src={imageSrc}
        alt=""
        width={220}
        height={220}
        aria-hidden
        className="mb-5 h-auto w-32 select-none sm:w-44"
      />
      <p className="text-base font-bold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
