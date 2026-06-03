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

## 🎨 UI, Styling & Desain

**Wajib baca [DESIGN.md](./DESIGN.md) sebelum membuat atau mengubah UI** — palet, tipografi, layout per area, pola komponen, dan checklist Agent ada di sana. Dokumen ini adalah otoritas desain; jangan mengandalkan preferensi warna dari prompt.

Ringkasan singkat (detail & contoh di `DESIGN.md`):

1. **Tailwind CSS v4 + Shadcn UI** — Tanpa `tailwind.config.js`; tema hanya di [app/globals.css](./app/globals.css) (`@theme inline`, `@import "tailwindcss"`).
2. **Warna** — Token semantic (`primary`, `muted-foreground`, …) atau utilitas `brand-*`; **dilarang** hex hardcoded di komponen.
3. **Komponen** — Primitif dari `components/ui/`; referensi visual marketing: [app/page.tsx](./app/page.tsx).
4. **UI kompleks** — Taruh di `features/*/components/`, bukan di `app/**/page.tsx`.

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
* **Proxy (Ganti Middleware):** Next.js 16+ mendepresiasi `middleware.ts` dan menggantinya dengan **`proxy.ts`** di root folder. Gunakan named export `export function proxy(request)` untuk memproses request terproteksi dan log redirects/rewrites secara aman.

---

## 📋 Pelacakan Progress (`docs/PROGRESS.md`)

[docs/PROGRESS.md](docs/PROGRESS.md) adalah **living tracker** Fase 1 MVP: apa yang sudah selesai, sebagian, atau belum. Setiap Agent **wajib** memperbarui berkas ini bila pekerjaan dalam sesi (atau PR) menyelesaikan atau secara nyata memajukan suatu fitur.

### Kapan wajib di-update

Perbarui `docs/PROGRESS.md` di **akhir tugas yang sama** (sebelum merespons selesai ke user), jika salah satu berikut terpenuhi:

* Satu **route/halaman** memenuhi spesifikasi di [sitemap.md](sitemap.md) (bukan sekadar `page.tsx` placeholder).
* Satu **domain `features/`** (actions, components, store) berfungsi end-to-end terhubung DB/auth sesuai desain.
* **Infrastruktur** (Clerk, proxy, webhook, seed, layout dashboard, dll.) benar-benar dipasang dan diverifikasi, bukan hanya file kosong.
* **Schema Prisma** atau aturan bisnis baru yang mengubah status item di tracker (mis. model pembayaran, enrollment).
* Route atau fitur **baru** ditambahkan — update [sitemap.md](sitemap.md) **dulu**, lalu tambah baris di `PROGRESS.md`.

Tidak perlu update untuk refactor kecil, typo, atau perubahan yang tidak mengubah status implementasi terhadap MVP.

### Cara update (wajib)

1. Baca `docs/PROGRESS.md` dan temukan baris yang relevan (§ Infrastruktur, § Halaman, § Domain `features/`, § Data, § Keamanan).
2. Ubah status: `⬜` → `🟡` (ada kemajuan nyata tapi belum MVP) atau `🟡` → `✅` (sesuai sitemap / kolom "Yang masih kurang" sudah terpenuhi).
3. Perbarui kolom **Catatan** / **Yang masih kurang** jika masih ada sisa pekerjaan kecil.
4. Sesuaikan **Ringkasan cepat** (hitungan Selesai / Sebagian / Belum) bila angka berubah.
5. **Hitung ulang progres global** di header `PROGRESS.md` (tabel per area, %, bar ASCII, meta **Progres global Fase 1** — ikuti rumus di dokumen).
6. Set **Terakhir diperbarui** (header) ke tanggal hari ini (`YYYY-MM-DD`).
7. Tambah satu baris di **Changelog** (tanggal + ringkasan singkat apa yang selesai).

### Aturan status (jangan dilanggar)

| Simbol | Gunakan hanya jika |
| :---: | :--- |
| ✅ | Perilaku fitur sesuai MVP; teruji atau jelas terhubung DB/auth/UI final |
| 🟡 | File/route ada, atau sebagian besar logic belum / masih stub |
| ⬜ | Belum ada implementasi bermakna |
| 🔮 | Sengaja di luar Fase 1 |

**DILARANG** menandai ✅ hanya karena file `page.tsx` atau folder `features/` sudah dibuat tanpa fungsi sesuai sitemap.

### Contoh changelog

```text
| 2026-06-10 | Clerk sign-in/sign-up + webhook sync User/UserStat ke Prisma |
```

Jika ragu apakah suatu item layak `✅`, biarkan `🟡` dan jelaskan sisa pekerjaan di kolom catatan.

---

## 🏃‍♂️ Perintah Terminal Harian
* Menjalankan Dev Server: `bun dev`
* Prisma (juga via `package.json` scripts):
  * Generate client: `bun run db:generate`
  * Format schema: `bun run db:format`
  * Sinkronisasi DB lokal (dev): `bun run db:push`
  * Migrasi (dev): `bun run db:migrate` · deploy: `bun run db:migrate:deploy`
  * Seed: `bun run db:seed`
  * Studio: `bun run db:studio`
  * Reset DB (dev): `bun run db:reset`
