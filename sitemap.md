# 🗺️ Sitemap JepangKu — LMS (Optimized)

- **Scope:** **LMS saja** (`kursus.jepangku.com`) — bagian dari ekosistem JepangKu (lihat [docs/ECOSYSTEM.md](docs/ECOSYSTEM.md))
- **Di luar repo ini:** Portal Berita (`jepangku.com`), Core Backend (SSO Clerk, profil, gamifikasi)
- **Fase:** 1 (MVP Target Akhir Juni 2026)
- **Base Domain:** `kursus.jepangku.com`

---

## 📌 Konvensi Simbol

| Simbol     | Keterangan                                       |
| :--------- | :----------------------------------------------- |
| `[slug]`   | Dynamic route / URL dinamis berdasarkan data     |
| `*`        | Requires login (Akses terproteksi khusus Siswa)  |
| `***`      | Requires login (Akses terproteksi khusus Admin)  |
| `[FASE 2]` | Fitur ditunda, di luar lingkup pengerjaan Fase 1 |

---

## 1. Public & Marketing Area (No Login Required)

Berisi halaman statis publik. Jika user yang sudah login mengakses root path (`/`), Proxy Next.js akan otomatis mengarahkan (redirect) mereka ke `/dashboard`.

```plaintext
/
├── /                            → Landing Page Utama
│   ├── Section: Hero + CTA Daftar (Redirect ke Auth Portal)
│   ├── Section: Fitur Unggulan (Gamifikasi XP & JLPT Center)
│   └── Section: Pricing Paket (CTA langsung ke WhatsApp Admin)
│
├── /kursus                      → Katalog Kursus (Read-Only)
│   ├── Filter: Level JLPT (N5, N4, N3, N2, N1) & Kategori
│   └── /[courseSlug]            → Detail Kursus Publik
│       ├── Deskripsi & Total Durasi
│       ├── Silabus (Preview Locked)
│       └── CTA: Mulai Belajar (Redirect ke login jika belum auth)
│
├── /tryout                      → Halaman Info Tryout JLPT (Read-Only)
│   └── Info Tryout, Jadwal, & CTA Daftar
│
└── /tes-penempatan              → Halaman Info Tes Penempatan (Read-Only)
    └── Penjelasan + CTA Daftar / Masuk
```

---

## 2. Auth Area (Clerk Out-of-the-Box Flow)

Menggunakan default route Clerk untuk kemudahan integrasi dan stabilitas Clerk hooks.

```plaintext
├── /sign-in                     → Form Login Custom via Clerk
│   └── Form: Email, Password, & Tombol "Masuk dengan Google" (OAuth)
│
└── /sign-up                     → Form Daftar Akun Custom via Clerk
    └── Form: Nama, Email, Password (User otomatis mendapat Role: STUDENT)
```

---

## 3. Student Area `*` (Requires Login)

Jantung utama aplikasi LMS. Mengelola progres belajar, pemutaran video materi, dan kuis.

```plaintext
/dashboard *                     → Student Hub Utama
├── Section: Progress Ringkasan (XP, Level, Badge Terbaru)
├── Section: Kursus yang Sedang Diikuti (Continue Learning)
└── Section: Shortcut ke Leaderboard & Tryout

/dashboard/kursus *              → Katalog Kursus (jelajahi + daftar)
└── /[courseSlug] *              → Detail kursus + enrollment

/dashboard/kursus-saya *         → Kursus terdaftar user (progress + lanjut belajar)

/dashboard/kana                       → Redirect → /dashboard/kana/hiragana
├── /hiragana *                  → Chart Hiragana (gojūon, dakuten, yōon)
└── /katakana *                  → Chart Katakana

/dashboard/live-class *          → Jadwal Live Class (Zoom)
├── Filter kategori + pencarian
└── Kartu kelas + link meeting

/dashboard/tryout *              → Simulasi JLPT (pilih sesi + level)
├── /riwayat *                   → Riwayat tryout siswa + buka analisa ulang
└── Mode ujian (?session=&level=) → Ruang ujian + timer + navigator soal

/dashboard/tes-penempatan *      → Hub tes penempatan (status + mulai / hasil terakhir)
├── /ujian *                     → Ruang ujian fokusus (satu soal + Next; Choukai audio kontinu)
└── /hasil/[attemptId] *         → Rekomendasi level JLPT + CTA kursus

/belajar/[courseSlug]/[lessonSlug] * → Course Workspace & Lesson View Page
├── Konten Pembelajaran (Teks, Gambar, Audio)
├── Secured Video Embed Player
└── Action: Tombol "Mark as Complete"

/kuis/[lessonSlug] *             → Halaman Kuis Interaktif (Focus Mode)
├── Render Soal Pilihan Ganda N5 (Data dari Seed CSV)
└── /hasil *                     → Halaman Hasil Evaluasi Kuis
    ├── Skor Kelulusan & Pembahasan
    └── Action: Pemicu Penambahan Point XP
```

---

## 4. Gamification Center `*` (Requires Login)

Area pelacakan progres siswa berdasarkan poin pengalaman (XP) yang diperoleh dari penyelesaian kuis dan materi.

```plaintext
/leaderboard *                   → Papan Peringkat Global
├── Urutan Ranking Top 10 Siswa (Berdasarkan Akumulasi XP)
└── Highlight Bar Khusus Posisi Siswa Saat Ini

/gamifikasi/profil-saya *        → Profil Pencapaian Personal
├── Grafik Progress XP Mingguan / Bulanan
├── Riwayat Log Perolehan XP Akhir
└── Galeri Koleksi Badge (Status Unlocked & Locked)
```

---

## 5. Admin Area & CMS `***` (Admin Only)

Manajemen konten materi dan validasi pembayaran. Impor massal via workbook Excel (kursus sensei N4/N5 & tryout).

```plaintext
/admin ***
├── /dashboard                   → Overview Statistik Sederhana
│
├── /pembayaran                  → Manajemen Validasi Akses Manual
│
├── /kursus                      → CMS: Manajemen Kursus
│   ├── /import                  → Impor kursus dari workbook sensei N4/N5
│   └── … modul / pelajaran / workspace
│
├── /tryout                      → CMS JLPT Tryout (sesi = event)
│   ├── /paket                   → Paket Soal (buat & isi soal Moji/Bunpou/Choukai)
│   │   ├── /form                → Buat paket baru
│   │   ├── /import              → Import ZIP (pratinjau dry-run → impor ke DB)
│   │   └── /[setId]             → Edit paket + tambah soal (terkunci jika sesi aktif)
│   ├── /bank                    → Redirect → /paket (menu bank dihapus)
│   ├── /import                  → Legacy notice → arahkan ke /paket/import
│   ├── /[sessionId]/susun       → Redirect → paket sesi / /paket
│   └── /[sessionId]/soal        → Redirect → /susun (legacy)
│
└── /quiz                        → Info bank soal (kelola per pelajaran di lesson workspace)
```

---

## 6. Halaman Statis Pendukung

```plaintext
/tentang                         → Profil & Visi JepangKu LMS
/cara-belajar                    → Panduan Sistem Level, XP, & Belajar
/hubungi                         → Tautan Integrasi ke WhatsApp Admin
/syarat-ketentuan                → Syarat & Ketentuan Penggunaan Platform
/kebijakan-privasi               → Kebijakan Privasi & Perlindungan Data
```

---

## 📊 Ringkasan Estimasi Halaman Fase 1

| Area Routing                   | Jumlah Halaman Aktif |
| :----------------------------- | :------------------- |
| Public / Marketing             | 4                    |
| Auth Area (Custom UI)          | 2                    |
| Student Area (Core LMS)        | 4                    |
| Gamification Center            | 2                    |
| Admin Area (Termasuk Lean CMS) | 8                    |
| Halaman Statis                 | 5                    |
| **Total Estimasi Beban Kerja** | **~25 Halaman**      |
