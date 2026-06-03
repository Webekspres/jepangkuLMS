# 🗺️ Sitemap JepangKu — LMS

- **Scope:** LMS only (Portal berita jepangku.com tidak termasuk dalam sitemap ini)
- **Fase:** 1 (MVP Target Akhir Juni 2026)
- **Base Domain:** `kursus.jepangku.com`

---

## 📌 Konvensi Simbol

| Simbol | Keterangan |
| :--- | :--- |
| `[slug]` | Dynamic route / URL dinamis berdasarkan data |
| `*` | Requires login (Akses terproteksi khusus Siswa) |
| `***` | Requires login (Akses terproteksi khusus Admin) |
| `[FASE 2]` | Fitur ditunda, di luar lingkup pengerjaan Fase 1 |

---

## 1. Public & Marketing Area (No Login Required)

Berisi halaman statis publik. Jika user yang sudah login mengakses root path (`/`), Middleware Next.js akan otomatis mengarahkan (redirect) mereka ke `/dashboard`.

```plaintext
/
├── /                            → Landing Page Utama
│   ├── Section: Hero + CTA Daftar (Redirect ke Auth Portal)
│   ├── Section: Fitur Unggulan (Gamifikasi XP & JLPT Center)
│   └── Section: Pricing Paket (CTA langsung ke WhatsApp Admin)
│
├── /kursus                      → Katalog Kursus (Read-Only)
│   ├── Filter: Level JLPT (N5, N4, N3, N2, N1) & Kategori
│   └── /[course-slug]           → Detail Kursus Publik
│       ├── Deskripsi & Total Durasi
│       ├── Silabus (Preview Locked)
│       └── CTA: Mulai Belajar (Redirect ke login jika belum auth)
│
└── /tryout                      → Halaman Info Tryout JLPT (Read-Only)
    └── Info Tryout, Jadwal, & CTA Daftar
```

---

## 2. Auth Area (Custom Flow via Clerk Hooks)

Halaman autentikasi fisik yang dibangun menggunakan custom hooks Clerk. Fitur pemulihan password dan verifikasi email dikelola sepenuhnya oleh sistem overlay Clerk Cloud.

```plaintext
/auth
├── /register                    → Form Daftar Akun Custom
│   └── Form: Nama, Email, Password (User otomatis mendapat Role: SISWA)
│
└── /login                       → Form Login Custom
    └── Form: Email, Password, & Tombol "Masuk dengan Google" (OAuth)
```

---

## 3. Student Area `*` (Requires Login)

Jantung utama aplikasi LMS. Mengelola progres belajar, pemutaran video materi, dan evaluasi kuis interaktif.

```plaintext
/dashboard *                     → Student Hub Utama
├── Section: Progress Ringkasan (XP, Level, Badge Terbaru)
├── Section: Kursus yang Sedang Diikuti (Continue Learning)
└── Section: Shortcut ke Leaderboard & Tryout

/belajar *
└── /kursus
    └── /[course-slug] *         → Course Workspace (Akses Penuh)
        ├── Progress Bar & Silabus Interaktif
        └── /lesson/[lesson-slug] * → Lesson View Page
            ├── Konten Pembelajaran (Teks, Gambar, Audio)
            ├── Secured Video Embed Player
            ├── Action: Tombol "Mark as Complete"
            │
            └── /quiz *          → Halaman Kuis Interaktif
                ├── Render Soal Pilihan Ganda N5 (Data dari Seed CSV)
                └── /hasil *     → Halaman Hasil Evaluasi Kuis
                    ├── Skor Kelulusan & Pembahasan
                    └── Action: Pemicu Penambahan Point XP
```

---

## 4. Gamification Center `*` (Requires Login)

Area pelacakan progres siswa berdasarkan poin pengalaman (XP) yang diperoleh dari penyelesaian kuis dan materi.

```plaintext
/gamifikasi *
├── /profil-saya                 → Profil Pencapaian Personal
│   ├── Grafik Progress XP Mingguan / Bulanan
│   ├── Riwayat Log Perolehan XP Akhir
│   └── Galeri Koleksi Badge (Status Unlocked & Locked)
│
└── /leaderboard                 → Papan Peringkat Global
    ├── Urutan Ranking Top 10 Siswa (Berdasarkan Akumulasi XP)
    └── Highlight Bar Khusus Posisi Siswa Saat Ini
```

---

## 5. Admin Area & CMS `***` (Admin Only)

Manajemen konten materi dan validasi pembayaran. Difokuskan pada efisiensi dengan memanfaatkan fitur upload CSV untuk bank soal agar tidak perlu membuat dynamic form yang kompleks.

```plaintext
/admin ***
├── /dashboard                   → Overview Statistik Sederhana
│   └── (Total Siswa Aktif, Jumlah Kursus, & Request Pembayaran Pending)
│
├── /pembayaran                  → Manajemen Validasi Akses Manual
│   ├── Tabel Antrean Request Pembayaran dari WhatsApp Admin
│   └── Action: Tombol "Approve & Enroll" (Membuka akses kelas untuk siswa)
│
├── /kursus                      → CMS: Manajemen Kursus
│   ├── Daftar Kursus
│   └── /form                    → Buat / Edit Detail Kursus (Judul, Deskripsi, Level N5)
│
├── /lesson                      → CMS: Manajemen Lesson (Materi)
│   ├── Daftar Lesson (Filter by Kursus)
│   └── /form                    → Buat / Edit Lesson (Teks Materi & Link Embed Video)
│
└── /quiz                        → CMS: Manajemen Bank Soal & Kuis
    ├── Daftar Kuis & Soal
    └── /import                  → Form Upload File CSV/Excel untuk Soal Kuis
```

---

## 6. Halaman Statis Pendukung

```plaintext
/tentang                         → Profil & Visi JepangKu LMS
/cara-belajar                    → Panduan Sistem Level, XP, & Belajar
/hubungi                         → Tautan Integrasi ke WhatsApp Admin
```

---

## 📊 Ringkasan Estimasi Halaman Fase 1

| Area Routing | Jumlah Halaman Aktif |
| :--- | :--- |
| Public / Marketing | 3 |
| Auth Area (Custom UI) | 2 |
| Student Area (Core LMS) | 7 |
| Gamification Center | 2 |
| Admin Area (Termasuk Lean CMS) | 4 |
| Halaman Statis | 3 |
| **Total Estimasi Beban Kerja** | **~21 Halaman** |