# 🗺️ JepangKu LMS - Platform Belajar Bahasa Jepang Interaktif

JepangKu LMS adalah aplikasi web pembelajaran mandiri bahasa Jepang terstruktur berbasis kurikulum JLPT (N5 - N1) yang menggabungkan metode pembelajaran modul kursus dengan sistem gamifikasi interaktif. Proyek ini dikembangkan menggunakan Next.js App Router, Bun, dan PostgreSQL.

---

## 🚀 Fitur Utama (Fase 1 MVP)

1. **Course & Lesson Terstruktur:** Modul pembelajaran lengkap terintegrasi video lessons, kosakata, tata bahasa, dan materi huruf kanji (fokus awal pada tingkat N5).
2. **Kuis Interaktif (Focus Mode):** Uji pemahaman materi di setiap akhir lesson dengan pembahasan soal yang komprehensif dan perhitungan skor instan.
3. **Sistem Gamifikasi:** Peningkatan skor pengalaman (XP), tingkat level akun, perolehan Badge pencapaian (achievements), serta papan peringkat global (Leaderboard).
4. **Validasi Akses & Bukti Pembayaran Manual:** Alur pendaftaran kelas manual terhubung langsung dengan verifikasi WhatsApp Admin serta panel persetujuan di sisi admin dashboard.
5. **Admin Capability & CMS:** Panel khusus admin untuk memvalidasi pembayaran siswa, mengelola detail kursus/lesson, serta bulk import bank soal kuis via file CSV/Excel.

---

## 🛠️ Stack Teknologi

- **Runtime & Package Manager:** [Bun](https://bun.sh)
- **Framework:** Next.js 16 (App Router) & React 19
- **CSS Utility & Styling:** Tailwind CSS v4 & Shadcn UI
- **Database Layer:** PostgreSQL & Prisma ORM
- **Authentication:** Clerk Auth Cloud
- **State Management:** Zustand (Local Client UI State) & TanStack Query (Server Cache State)
- **Data Validation:** Zod

---

## 📁 Struktur Folder Utama (Feature-Based)

Mengadopsi pola **Feature-Based (Domain-Driven)** di mana folder `app/` murni hanya bertindak sebagai routing layer, sedangkan logika bisnis diisolasi penuh di dalam folder `features/`:

```plaintext
jepangkuLMS/
├── app/                           # 🌐 LAYOUT & ROUTING (Thin Layer)
│   ├── (authentication)/          # Route Group Login & Register via Clerk
│   ├── (dashboard)/               # Route Group Student Hub, Leaderboard, & Kuis
│   ├── admin/                     # Area CMS khusus Admin & Validasi Pembayaran
│   ├── kursus/                    # Katalog & detail kursus publik
│   └── api/webhooks/clerk/        # Sync User data dari Clerk Webhook
├── components/                    # 🏗️ SHARED GLOBAL UI COMPONENTS
│   ├── layout/                    # Navigasi Sidebar & Header Dashboard
│   └── providers/                 # QueryProvider, ClerkProvider
├── features/                      # 🧠 DOMAIN LOGIC (Isolasi Fitur)
│   ├── gamification/              # Logika XP, Level, Badge, & Leaderboard
│   ├── learning/                  # Manajemen Modul & Lesson
│   ├── quiz-engine/               # State, Layout, & Evaluasi Kuis (Zustand Store)
│   └── admin-cms/                 # CMS Internal Admin & Validasi Pembayaran
├── lib/                           # ⚙️ Shared Config (Prisma Client Singleton)
└── prisma/                        # 🗄️ Prisma Database Schema, Seeds, & Migrations
```

---

## ⚙️ Cara Memulai (Getting Started)

### 1. Prasyarat (Prerequisites)
Pastikan Anda sudah menginstal **Bun** di mesin lokal Anda. Jika belum, jalankan:
```bash
powershell -c "irm bun.sh/install.ps1 | iex" # Untuk Windows
# atau
curl -fsSL https://bun.sh/install | bash     # Untuk macOS/Linux
```

### 2. Instalasi Dependensi
Jalankan perintah berikut di root folder proyek:
```bash
bun install
```

### 3. Setup Variabel Lingkungan (Environment Variables)
Salin file `.env.example` menjadi `.env` lalu lengkapi kredensial PostgreSQL dan API Key Clerk Anda:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/jepangku"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 4. Sinkronisasi & Migrasi Database
Jalankan perintah berikut untuk mensinkronisasikan skema Prisma ke database lokal:
```bash
bunx prisma db push
```

### 5. Jalankan Seeding Data Awal
Untuk mengisi database dengan master data awal (paket kursus, silabus, dan soal kuis dari CSV), jalankan:
```bash
bunx prisma db seed
```

### 6. Jalankan Server Pengembangan (Dev Server)
Jalankan dev server menggunakan Bun:
```bash
bun dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

---

## 🤝 Konvensi Kolaborasi Tim & Branching
1. **Branch Utama:** `main` harus selalu stabil dan dapat di-*build* tanpa error.
2. **Branching Kolaborasi:** Tarik branch baru dari `main` ter-update dengan penamaan format `dev/nama_dev` (contoh: `dev/kris` atau `dev/partner`) untuk menandakan kepemilikan workspace pengembangan.
3. **Pull Request (PR):** Jangan lakukan merge langsung ke `main`. Buat Pull Request di repository Git, lakukan review tim, lalu merge setelah disetujui.

---

## 🔗 Referensi Tambahan
- [sitemap.md](file:///d:/ka_treasury/JepangKu/jepangkuLMS/sitemap.md) - Single Source of Truth untuk URL Routing
- [docs/ARCHITECTURE.md](file:///d:/ka_treasury/JepangKu/jepangkuLMS/docs/ARCHITECTURE.md) - Panduan Aliran Data & Struktur Detail Arsitektur
- [docs/DEV_NOTES.md](file:///d:/ka_treasury/JepangKu/jepangkuLMS/docs/DEV_NOTES.md) - Catatan Harian & Kerja Sprint Developer
