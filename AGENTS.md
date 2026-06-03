<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🤖 JepangKu LMS - AI Coding Agent Guidelines

Selamat datang Agent! Dokumen ini berisi instruksi, konvensi, dan aturan arsitektur untuk proyek JepangKu LMS. Patuhi pedoman ini secara ketat untuk menjaga kebersihan kode dan menghindari konflik.

---

## 🛠️ Stack & Runtime Utama
* **Runtime & Package Manager:** `Bun` (Gunakan `bun` untuk menginstal dependensi, menjalankan dev server, dan seeding).
* **Framework:** Next.js (App Router, TS, React 19).
* **Styling:** **Tailwind CSS v4** (Perhatikan instruksi khusus Tailwind v4 di bawah).
* **Database ORM:** Prisma ORM dengan PostgreSQL adapter.
* **State Management:** Zustand (Client-side UI) & TanStack Query (Server-cache state).
* **Autentikasi:** Clerk Auth Cloud.

---

## 🎨 Aturan Khusus Styling & Tailwind CSS v4
Proyek ini menggunakan **Tailwind CSS v4** dan **Shadcn UI**. Patuhi aturan berikut demi konsistensi visual:

1. **Tanpa `tailwind.config.js`:** Tailwind v4 dikonfigurasi menggunakan CSS-native directive. Jangan membuat file `tailwind.config.js` baru.
2. **Kustomisasi Tema:** Semua modifikasi warna, font, dan kustomisasi tema utilitas dilakukan langsung di dalam [app/globals.css](file:///d:/ka_treasury/JepangKu/jepangkuLMS/app/globals.css) menggunakan syntax directive `@theme inline` atau CSS custom variables.
3. **Import Syntax:** Gunakan `@import "tailwindcss";` di bagian atas file CSS global utama.

---

## 🎯 Panduan Desain & Merek (Brand Guidelines)
Seluruh AI Agent wajib mematuhi panduan warna dan tipografi resmi yang tercantum di dalam [app/globals.css](file:///d:/ka_treasury/JepangKu/jepangkuLMS/app/globals.css):

1. **Palet Warna Utama (Branding Colors):**
   * **Red Japanese (`#EC1D24` / `brand-red`):** Warna primer JepangKu. Dipetakan ke variabel `--primary`. Digunakan untuk aksi utama, tombol utama, status aktif, dan aksen penting.
   * **Navy (`#1E1B57` / `brand-navy`):** Warna struktural sekunder. Dipetakan ke variabel `--secondary` dan `--sidebar`. Digunakan untuk header, panel, latar belakang sidebar, dan text branding gelap.
   * **Orange (`#FF4B2B` / `brand-orange`):** Warna aksen sorotan. Dipetakan ke variabel `--accent` dan `--ring` (focus indicator). Digunakan untuk interaksi hover, penarik perhatian, dan promo.
   * **Yellow (`#F8E71C` / `brand-yellow`):** Warna pencapaian/hadiah. Digunakan untuk medali/badge emas, bonus XP, dan highlight rewards.

2. **Aturan Penulisan Styling:**
   * **DILARANG** menuliskan hex code warna secara acak/hardcoded di dalam komponen (misalnya: `text-[#EC1D24]`, `bg-[#1E1B57]`).
   * **WAJIB** menggunakan semantic class bawaan Shadcn UI (`bg-primary`, `bg-secondary`, `bg-accent`, `text-muted-foreground`) atau utilitas brand warna kustom (`bg-brand-red`, `text-brand-navy`, `bg-brand-orange`, `text-brand-yellow`).

3. **Gunakan Shadcn UI untuk Komponen & Primitif:**
   * Semua elemen UI dasar (button, dialog, input, card, tabs, sheets, dsb.) harus diimpor dari primitif Shadcn UI di folder `components/ui/`.
   * Jangan menginstal library komponen pihak ketiga lainnya (seperti Material UI atau Chakra) tanpa koordinasi.

---

## 🧭 Arsitektur Folder: Feature-Based (Domain-Driven)
Kami memisahkan layout routing dengan logika bisnis utama. Patuhi struktur di bawah ini:

1. **Routing Layer (`app/`):**
   * Murni bertindak sebagai "resepsionis/routing" (RSC tipis).
   * File `page.tsx` di dalam `app/` dilarang menulis logic database rumit secara langsung atau me-render elemen UI kompleks. Panggil wrapper component dari `features/` untuk menangani rendering.
   * Rute terproteksi bagi siswa dibungkus di dalam Route Group `app/(dashboard)/*`.
   * Rute terproteksi bagi admin dibungkus di dalam folder `app/admin/*`.

2. **Isolasi Domain (`features/`):**
   * Seluruh logika bisnis, state, Server Actions, dan UI khusus ditaruh di sini.
   * **Domain Terbagi Menjadi:**
     * `features/gamification/`: Logika XP, Level, Badge, & Leaderboard.
     * `features/learning/`: Logika Course, Lesson, Silabus, & Video Player.
     * `features/quiz-engine/`: Logika Soal, Navigasi Kuis, Scoring, & Zustand Store.
     * `features/admin-cms/`: Logika Approval Pembayaran & Bulk Import CSV.
   * **Struktur Internal Domain Fitur:**
     * `actions/`: Next.js Server Actions dengan direktif `"use server"`.
     * `components/`: UI khusus untuk fitur tersebut.
     * `store/`: Zustand local store (misalnya `useQuizStore.ts` untuk kuis).

3. **Shared Components & Core:**
   * Komponen UI primitif / reusable non-domain ditaruh di `components/ui/` (misalnya tombol, dialog, input).
   * Konfigurasi database ditaruh di `prisma/schema.prisma` dan inisialisasi client ditaruh di `lib/prisma.ts`.

---

## 📊 Aturan Data Fetching & State
* **Direct Server Query (RSC):** Gunakan query Prisma secara langsung di dalam Server Component (`app/` page) untuk pengambilan data awal (Initial Load) yang cepat.
* **Server Actions:** Untuk modifikasi data (Write/Update), wajib menggunakan Server Actions yang ditempatkan di folder `actions/` fitur terkait. Panggil direktif `"use server"` di baris paling atas file.
* **TanStack Query (Client-side):** Gunakan untuk bagian UI interaktif yang membutuhkan revalidation/auto-refresh cepat tanpa hard-reload halaman.
* **Zustand Store:** Gunakan store lokal di dalam folder `store/` fitur untuk mengelola local state transient yang kompleks (seperti jawaban kuis sementara milik user).

---

## 🔗 Panduan Routing & Sitemap
* Rujuklah berkas [sitemap.md](file:///d:/ka_treasury/JepangKu/jepangkuLMS/sitemap.md) sebagai **Single Source of Truth** untuk URL paths.
* **Clean URLs:** Gunakan slug unik (`[courseSlug]`, `[lessonSlug]`) alih-alih database ID dalam URL halaman belajar siswa untuk optimasi SEO dan estetika URL yang bersih.
* **Focus Mode Routing:** Workspace kuis ditaruh di top-level route `/kuis/[lessonSlug]` agar terlepas dari layout sidebar utama `/belajar` dan memberikan fokus penuh bagi siswa.

---

## 🏃‍♂️ Perintah Terminal Harian
* Menjalankan Dev Server: `bun dev`
* Format Schema: `bunx prisma format`
* Sinkronisasi DB lokal: `bunx prisma db push`
* Membuka GUI DB: `bunx prisma studio`
* Menjalankan Seeding DB: `bunx prisma db seed`
