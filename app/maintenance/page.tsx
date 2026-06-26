import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { LANDING_HERO_GRID_STYLE } from '@/features/marketing/components/landing-data';

export const metadata: Metadata = {
  title: 'Sistem Dioptimalisasi — JepangKu LMS',
  description: 'Kami sedang menyelaraskan energi Seishin server kami.',
};

export default function MaintenancePage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 text-white p-4">
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={LANDING_HERO_GRID_STYLE}
      />

      {/* Radial glows */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-yellow/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-10 left-4 h-72 w-72 rounded-full bg-brand-red/10 blur-[100px]" />

      <div className="relative z-10 flex max-w-md flex-col items-center text-center">
        {/* Animated Icon Container */}
        <div className="relative mb-6 flex size-20 items-center justify-center rounded-full bg-linear-to-br from-amber-500/20 to-amber-900/40 border border-brand-yellow/40 text-brand-yellow shadow-[0_0_20px_rgba(248,231,28,0.2)] animate-pulse">
          <ShieldAlert className="size-10 text-brand-yellow drop-shadow-[0_0_8px_rgba(248,231,28,0.7)]" />
          <div className="absolute inset-0 rounded-full animate-ping border border-brand-yellow/40 opacity-30 scale-105" />
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Sistem Sedang <br />
          <span className="text-brand-yellow drop-shadow-[0_2px_8px_rgba(248,231,28,0.4)]">Dioptimalisasi</span>
        </h1>

        {/* Custom RPG Copywriting */}
        <p className="mb-8 text-sm text-slate-300 leading-relaxed max-w-sm">
          Kami sedang menyelaraskan energi Seishin server kami ⚔️. Silakan coba masuk kembali beberapa menit lagi!
        </p>

        {/* Retry Action */}
        <div className="w-full space-y-3">
          <Button asChild className="w-full bg-brand-yellow text-slate-950 font-bold hover:bg-brand-yellow/90 border border-transparent">
            <Link href="/dashboard">
              Coba Lagi
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white font-semibold">
            <Link href="/">
              Kembali ke Beranda
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
