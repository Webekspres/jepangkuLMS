# 🗺️ JepangKu LMS - Platform Belajar Bahasa Jepang Interaktif

JepangKu LMS adalah aplikasi web pembelajaran mandiri bahasa Jepang (JLPT N5–N1) — **satu aplikasi dalam ekosistem JepangKu**. Modul belajar, kuis, dan progress disimpan di database LMS; **profil user, SSO (Clerk), dan gamifikasi (XP/badge)** dikelola oleh **Core Backend** terpisah. Stack: Next.js App Router, Bun, PostgreSQL (Prisma).

📘 **Arsitektur ekosistem:** [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md) · **Schema Core:** [docs/backend_core_services/](docs/backend_core_services/) · **Agent rules:** [AGENTS.md](AGENTS.md)

---

## 🚀 Fitur Utama (Fase 1 MVP)

1. **Course & Lesson Terstruktur:** Modul pembelajaran lengkap terintegrasi video lessons, kosakata, tata bahasa, dan materi huruf kanji (fokus awal pada tingkat N5).
2. **Kuis Interaktif (Focus Mode):** Uji pemahaman materi di setiap akhir lesson dengan pembahasan soal yang komprehensif dan perhitungan skor instan.
3. **Sistem Gamifikasi (via Core Service):** UI XP, level, badge, dan leaderboard di LMS — data dari JepangKu Core Backend, bukan DB lokal.
4. **Validasi Akses & Bukti Pembayaran Manual:** Alur pendaftaran kelas manual terhubung langsung dengan verifikasi WhatsApp Admin serta panel persetujuan di sisi admin dashboard.
5. **Admin Capability & CMS:** Panel khusus admin untuk memvalidasi pembayaran siswa, mengelola detail kursus/lesson, serta bulk import bank soal kuis via file CSV/Excel.

---

## 🛠️ Stack Teknologi

- **Runtime & Package Manager:** [Bun](https://bun.sh)
- **Framework:** Next.js 16 (App Router) & React 19
- **CSS Utility & Styling:** Tailwind CSS v4 & Shadcn UI — panduan desain: [DESIGN.md](./DESIGN.md)
- **Database Layer:** PostgreSQL & Prisma ORM
- **Identity / SSO:** JepangKu Core Backend (Clerk hosted di Core) · adapter: `lib/core/`
- **State Management:** Zustand (Local Client UI State) & TanStack Query (Server Cache State)
- **Data Validation:** Zod

---

## 📁 Struktur Folder Utama (Feature-Based)

Mengadopsi pola **Feature-Based (Domain-Driven)** di mana folder `app/` murni hanya bertindak sebagai routing layer, sedangkan logika bisnis diisolasi penuh di dalam folder `features/`:

```plaintext
jepangkuLMS/
├── DESIGN.md                      # 🎨 Panduan UI/UX (wajib untuk AI Agents)
├── AGENTS.md                      # 🤖 Aturan arsitektur & coding Agent
├── docs/ECOSYSTEM.md              # 🌐 Batas LMS vs Core vs Portal Berita
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
├── lib/                           # ⚙️ prisma, validations, query-client
│   └── core/                      # 🔗 Profil & gamifikasi dari Core Backend
└── prisma/                        # 🗄️ DB LMS (User = jangkar FK ke Core user id)
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
Salin template env lalu isi kredensial lokal Anda:
```bash
cp .env.example .env
```
Variabel wajib & opsional dijelaskan di [`.env.example`](./.env.example). Minimal untuk Prisma lokal:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jepangku_lms"
```
`JEPANGKU_CORE_API_URL` + JWT verify env untuk Core. **Profil user aktif** dari **JWT claims** (bukan DB LMS). Clerk hanya di Core — lihat [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md).

### 4. Sinkronisasi & Migrasi Database
Jalankan perintah berikut untuk mensinkronisasikan skema Prisma ke database lokal:
```bash
bun run db:push
```

### 5. Jalankan Seeding Data Awal
Untuk mengisi database dengan master data awal (paket kursus, silabus, dan soal kuis dari CSV), jalankan:
```bash
bun run db:seed
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
