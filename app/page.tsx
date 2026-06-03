import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased flex flex-col">
      {/* 🧭 Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/brand/logo.png"
                alt="JepangKu Logo"
                width={130}
                height={36}
                className="h-9 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/brand/logo-white.png"
                alt="JepangKu Logo"
                width={130}
                height={36}
                className="h-9 w-auto object-contain hidden dark:block"
                priority
              />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/kursus" className="transition-colors hover:text-brand-red">Katalog</Link>
              <Link href="/tryout" className="transition-colors hover:text-brand-red">Tryout JLPT</Link>
              <Link href="/leaderboard" className="transition-colors hover:text-brand-red">Leaderboard</Link>
              <Link href="/tentang" className="transition-colors hover:text-brand-red">Tentang Kami</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button variant="outline" className="border-brand-navy/20 hover:border-brand-navy hover:text-brand-navy dark:border-white/20 dark:hover:text-white">
                Masuk
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-brand-red hover:bg-brand-orange text-white shadow-md shadow-brand-red/20 transition-all hover:scale-102">
                Daftar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 flex-1 flex flex-col justify-center">
        {/* Soft Decorative Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-red/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-brand-orange/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-4 md:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start gap-6 text-left relative z-10">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-red/10 text-brand-red border border-brand-red/20">
              <span className="flex h-2 w-2 rounded-full bg-brand-red animate-pulse"></span>
              🏆 Platform LMS JepangKu
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-none text-brand-navy dark:text-white">
              Kuasai Bahasa Jepang <br />
              <span className="bg-gradient-to-r from-brand-red via-brand-orange to-brand-red bg-clip-text text-transparent">
                Interaktif & Seru
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              Mulai perjalanan belajar bahasa Jepang Anda dari Nol (N5) hingga tingkat Mahir. 
              Didukung kurikulum terstruktur, video lesson secured, engine kuis, dan gamifikasi 
              XP/Badge yang membuat belajar ketagihan!
            </p>

            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              <Link href="/sign-up">
                <Button size="lg" className="bg-brand-red hover:bg-brand-orange text-white px-8 py-6 rounded-xl shadow-lg shadow-brand-red/25 text-base">
                  Mulai Belajar Sekarang
                </Button>
              </Link>
              <Link href="/kursus">
                <Button size="lg" variant="outline" className="border-brand-navy text-brand-navy hover:bg-brand-navy/5 dark:border-white dark:text-white px-8 py-6 rounded-xl text-base">
                  Lihat Katalog
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Side Showcase: Interactive UI Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-red/20 to-brand-yellow/10 rounded-2xl blur-2xl opacity-50"></div>
            
            {/* Premium Card Container */}
            <div className="relative border border-border bg-card text-card-foreground rounded-2xl shadow-xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand-navy flex items-center justify-center text-white font-bold shadow-md shadow-brand-navy/20">
                    KT
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-brand-navy dark:text-white">Kenji Tanaka</h3>
                    <p className="text-xs text-muted-foreground">Siswa N5 Aktif</p>
                  </div>
                </div>
                <span className="bg-brand-yellow/10 text-yellow-600 dark:text-brand-yellow border border-brand-yellow/20 px-2.5 py-1 rounded-full text-xs font-bold">
                  ⚡ PRO
                </span>
              </div>

              {/* XP Level Progress Bar */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-brand-navy dark:text-gray-300">Level 12 (Nihongo Master)</span>
                  <span className="font-bold text-brand-red">7,850 / 10,000 XP</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-red via-brand-orange to-brand-yellow rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(255,75,43,0.4)]"
                    style={{ width: '78.5%' }}
                  ></div>
                </div>
              </div>

              {/* Badge Achievements */}
              <div className="flex flex-col gap-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Badge Pencapaian</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border bg-muted/30">
                    <span className="text-2xl">🔥</span>
                    <span className="text-[10px] font-bold text-center">7 Hari Beruntun</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-border bg-muted/30">
                    <span className="text-2xl">📚</span>
                    <span className="text-[10px] font-bold text-center">Kanji N5 Master</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-brand-yellow/30 bg-brand-yellow/5">
                    <span className="text-2xl animate-bounce">🎯</span>
                    <span className="text-[10px] font-bold text-brand-navy dark:text-brand-yellow text-center">Lulus Tryout 1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎨 Theme & Style Playground for Developers */}
      <section className="bg-muted/50 border-t border-b border-border py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl mx-auto flex flex-col gap-10">
            <div className="text-center flex flex-col gap-2">
              <h2 className="text-3xl font-bold text-brand-navy dark:text-white">🎨 Tema & Style Playground</h2>
              <p className="text-muted-foreground text-sm">Preview pewarisan warna branding pada komponen UI Shadcn asli</p>
            </div>

            {/* Buttons Showcase */}
            <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Tombol Shadcn (Shadcn Variants)</h3>
              <div className="flex flex-wrap gap-4 items-center">
                {/* Default variant -> maps to Red Japanese */}
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-[11px] text-muted-foreground">Default (Primary Red)</span>
                  <Button variant="default">Red Action</Button>
                </div>

                {/* Secondary variant -> maps to Navy */}
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-[11px] text-muted-foreground">Secondary (Navy)</span>
                  <Button variant="secondary">Navy Component</Button>
                </div>

                {/* Accent/Orange Button */}
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-[11px] text-muted-foreground">Custom Accent</span>
                  <Button className="bg-brand-orange hover:bg-brand-orange/85 text-white">Orange Highlight</Button>
                </div>

                {/* Outline variant */}
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-[11px] text-muted-foreground">Outline</span>
                  <Button variant="outline">Border Outline</Button>
                </div>

                {/* Destructive variant */}
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-[11px] text-muted-foreground">Destructive</span>
                  <Button variant="destructive">Delete Item</Button>
                </div>
              </div>
            </div>

            {/* Alert & Utility Colors */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-brand-yellow/5 border border-brand-yellow/20 rounded-xl p-5 flex gap-3 text-brand-navy dark:text-brand-yellow">
                <span className="text-2xl">💡</span>
                <div>
                  <h4 className="font-bold text-sm">Info Poin & Gamifikasi (Yellow)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Variabel warna kuning digunakan khusus untuk merepresentasikan status rewards dan bonus XP siswa.</p>
                </div>
              </div>
              <div className="bg-brand-orange/5 border border-brand-orange/20 rounded-xl p-5 flex gap-3 text-brand-orange">
                <span className="text-2xl">🚀</span>
                <div>
                  <h4 className="font-bold text-sm">Promo / Flash Action (Orange)</h4>
                  <p className="text-xs text-muted-foreground mt-1">Variabel warna orange digunakan sebagai penarik perhatian/akselerasi kuis.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 👣 Footer */}
      <footer className="border-t border-border bg-card py-8 mt-auto">
        <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 JepangKu LMS. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex items-center gap-6">
            <Link href="/tentang" className="hover:text-brand-red">Tentang</Link>
            <Link href="/cara-belajar" className="hover:text-brand-red">Panduan</Link>
            <Link href="/hubungi" className="hover:text-brand-red">Hubungi Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
