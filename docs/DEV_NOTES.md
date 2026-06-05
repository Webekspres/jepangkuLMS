# 📝 JepangKu LMS - Developer Notes & Architecture Guide

Dokumen ini dirancang sebagai panduan kolaborasi tim agar struktur kode tetap konsisten selama Fase 1 MVP (target 30 Juni 2026).

**Ekosistem:** LMS ini satu app di antara Core Backend (Sultan) dan Portal Berita (Habibi). Baca **[ECOSYSTEM.md](./ECOSYSTEM.md)** sebelum mengubah `User`, auth, atau gamifikasi.

---

## 🚀 Quick Stack Checklist
- **Runtime & Package Manager:** Bun
- **Framework:** Next.js (App Router, TypeScript)
- **Database Layer:** PostgreSQL lokal (dev) via `prisma.config.ts` + Prisma ORM — prod host **TBD**; portabilitas: [DATABASE.md](./DATABASE.md)
- **State Management:** Zustand (Client-side UI) & TanStack Query (Server-cache state)
- **Authentication:** Clerk Auth
- **Design / UI:** [DESIGN.md](../DESIGN.md) (panduan warna, layout, Shadcn — wajib untuk Agent)

---

## 🤝 Git & Branching Rules (Anti-Conflict)
1. **Branch Utama:** `main` harus selalu steril, stabil, dan bisa di-*build* tanpa error.
2. **Naming Convention Branch:** `dev/nama_dev` (Contoh: `dev/kris` atau `dev/partner`).
3. **Workflow:**
   - Selalu tarik branch baru dari `main` yang paling update.
   - Jangan pernah *merge* langsung ke `main` di lokal. Buat **Pull Request (PR)** di GitHub/GitLab, minta rekan tim untuk *code review* singkat, baru di-*merge*.
4. **Strategi Pembagian Kerja (Vertikal Slicing):**
   - **Kris (LMS repo ini):** Learning, quiz engine, CMS LMS, UI dashboard; integrasi **`lib/core/`** untuk profil/XP; **User jangkar** di Prisma.
   - **Sultan (Core):** Clerk SSO, profil global, mesin gamifikasi, API untuk LMS/Berita.
   - **Habibi (Portal Berita):** App & DB berita terpisah.

---

## 📁 Feature-Based Folder Architecture

Aplikasi ini menggunakan pola **Feature-Based (Domain-Driven)**. Folder `app/` murni hanya bertindak sebagai "resepsionis/routing", sedangkan seluruh logika bisnis, komponen UI khusus, dan Next.js Server Actions diisolasi penuh di dalam folder `features/`.

```text
jepangkuLMS/
├── app/                           # 🌐 ROOT ROUTING & LAYOUTS (Steril)
│   ├── (authentication)/          # Route Group Auth (Sign-in / Sign-up)
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   │
│   ├── (dashboard)/               # Route Group Dashboard (Terproteksi Proxy)
│   │   ├── dashboard/page.tsx     # Student Dashboard Hub
│   │   ├── belajar/[courseSlug]/[lessonSlug]/page.tsx # Course & Lesson Workspace
│   │   ├── kuis/[lessonSlug]/     # Workspace Engine Kuis
│   │   │   ├── page.tsx           # Halaman Soal Kuis
│   │   │   └── hasil/page.tsx     # Hasil Evaluasi Kuis
│   │   ├── leaderboard/page.tsx   # Peringkat Global
│   │   └── gamifikasi/profil-saya/page.tsx # Profil Pencapaian Siswa
│   │
│   ├── admin/                     # Area Khusus Admin (Protected)
│   │   ├── dashboard/page.tsx
│   │   ├── pembayaran/page.tsx
│   │   ├── kursus/                # CMS Kursus & Form
│   │   │   ├── page.tsx
│   │   │   └── form/page.tsx
│   │   ├── lesson/                # CMS Lesson & Form
│   │   │   ├── page.tsx
│   │   │   └── form/page.tsx
│   │   └── quiz/                  # CMS Quiz & Bulk Import CSV
│   │       ├── page.tsx
│   │       └── import/page.tsx
│   │
│   ├── kursus/page.tsx            # Katalog Kursus Publik
│   ├── tryout/page.tsx            # Info Tryout Publik
│   ├── tentang/page.tsx           # Halaman Statis Tentang
│   ├── cara-belajar/page.tsx      # Halaman Statis Cara Belajar
│   ├── hubungi/page.tsx           # Halaman Statis Hubungi Kami
│   │
│   ├── api/webhooks/clerk/route.ts # Webhook penangkap user baru dari Clerk
│   ├── layout.tsx                 # Root layout utama
│   └── page.tsx                   # Public Landing Page
│
├── components/                    # 🏗️ SHARED GLOBAL COMPONENTS
│   ├── layout/                    # Sidebar Navigasi Utama, Navbar Dashboard
│   ├── providers/                 # ClerkProvider, QueryProvider (TanStack)
│   └── ui/                        # Komponen Primitif Shadcn UI (Button, Card, dll.)
│
├── features/                      # 🧠 JANTUNG BISNIS LOGIC (Isolasi Fitur)
│   ├── gamification/              # Fitur Progress, XP, Level, & Badge
│   │   ├── actions/               # Server Actions (claimBadge(), getUserRank())
│   │   └── components/            # UI khusus (LeaderboardTable.tsx, LevelProgressBar.tsx)
│   │
│   ├── learning/                  # Fitur Manajemen Modul & Media Pembelajaran
│   │   ├── actions/               # Server Actions (completeLesson(), getCourseContent())
│   │   └── components/            # UI khusus (VideoPlayer.tsx, KanjiCard.tsx)
│   │
│   ├── quiz-engine/               # Fitur Algoritma Kuis & State Kuis
│   │   ├── actions/               # Server Actions (submitQuizAttempt())
│   │   ├── components/            # UI khusus (QuizWorkspace.tsx, QuestionCard.tsx)
│   │   └── store/                 # Zustand Store (useQuizStore.ts untuk simpan state jawaban)
│   │
│   └── admin-cms/                 # Fitur Manajemen Konten Internal Admin
│       ├── actions/               # Server Actions (createLesson(), uploadExcelMateri())
│       └── components/            # UI khusus (MateriTable.tsx)
│
├── lib/                           # ⚙️ CORE CONFIGS (prisma.ts singleton, utils.ts)
├── prisma/                        # 🗄️ DATABASE SCHEMA & SEED (schema.prisma, seed.ts)
```

---

## 🛠️ Data Fetching & State Rules
1. **Data Statis / Initial Load:** Gunakan Server Component bawaan Next.js dengan async/await langsung memanggil `prisma.[model].findMany()` untuk performa rendering dan kecepatan muat yang maksimal.
2. **Mutasi Data (Write/Update):** Wajib menggunakan Next.js Server Actions yang ditaruh di folder `actions/` fitur terkait. Panggil direktif `"use server"` di baris paling atas file.
3. **Data Interaktif / Auto-Refresh:** Fitur dinamis seperti komentar forum atau real-time Leaderboard wajib di-fetch di sisi client menggunakan TanStack Query melalui API endpoint khusus atau di-trigger dari Server Actions agar UI reaktif tanpa perlu hard-reload halaman.
4. **Local UI State:** Jawaban kuis sementara yang dipilih user atau status animasi modal wajib dikelola via Zustand Store lokal fitur agar performa render ringan.

---

## 🏃‍♂️ Daily Useful Commands (Bun Version)
- Run Dev Server: `bun dev`
- Prisma: `bun run db:format` · `db:push` · `db:migrate` · `db:seed` · `db:studio` · `db:generate` · `db:reset`