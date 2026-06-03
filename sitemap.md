# Sitemap JepangKu — LMS

> Scope: LMS only (portal berita tidak termasuk)
> Fase: 1 (MVP akhir Juni 2026)

---

## Konvensi

| Simbol | Keterangan |
|--------|-----------|
| `[slug]` | Dynamic route |
| `*` | Requires login (student) |
| `**` | Requires login (contributor) |
| `***` | Requires login (admin) |
| `[FASE 2]` | Di luar scope Fase 1 |

---

## 1. Public / Marketing

```
/lms
├── /                          → LMS Landing Page
│   ├── Section: Hero + CTA daftar
│   ├── Section: Fitur unggulan (gamifikasi, JLPT, live class)
│   ├── Section: Testimoni / social proof
│   ├── Section: Sample learning path N5
│   ├── Section: Pricing / paket (CTA ke WhatsApp Admin)
│   └── Section: FAQ
│
├── /kursus                    → Katalog Kursus (publik, read-only)
│   ├── Filter: Level JLPT (N5, N4, N3, N2, N1)
│   ├── Filter: Kategori (Kosakata, Tata Bahasa, Kanji, Percakapan)
│   └── /[course-slug]         → Detail Kursus (publik, read-only)
│       ├── Deskripsi kursus
│       ├── Silabus / daftar lesson (preview locked)
│       ├── Instruktur
│       ├── Total durasi & jumlah lesson
│       └── CTA: Mulai Belajar / Daftar Kelas
│
├── /tryout                    → Halaman Tryout JLPT (publik, read-only)
│   └── Info tryout, jadwal, CTA daftar
│
└── /live-class                → Jadwal Live Class (publik, read-only)
    └── Info sesi, instruktur, CTA daftar via WhatsApp Admin
```

---

## 2. Auth

```
/lms/auth
├── /register                  → Halaman Daftar Akun
│   ├── Form: nama, email, password
│   ├── Pilihan role: Siswa / Kontributor
│   └── CTA: Sudah punya akun? Login
│
├── /login                     → Halaman Login
│   ├── Form: email, password
│   ├── Link: Lupa password
│   └── CTA: Belum punya akun? Daftar
│
├── /forgot-password           → Kirim email reset
├── /reset-password            → Form password baru (via token email)
└── /verify-email              → Konfirmasi email (opsional Fase 1)
```

---

## 3. Student Area *

```
/lms/dashboard *               → Student Dashboard
├── Section: Progress ringkasan (XP, level, badge terbaru)
├── Section: Kursus yang sedang diikuti
├── Section: Lesson terakhir dibuka (Continue Learning)
├── Section: Upcoming live class
├── Section: Notifikasi (badge baru, kursus baru)
└── Section: Shortcut ke Tryout & Leaderboard

/lms/belajar *
├── /kursus                    → Daftar kursus yang diikuti
│   └── /[course-slug] *       → Course Page (akses penuh)
│       ├── Progress bar kursus
│       ├── Daftar lesson (locked/unlocked)
│       └── /lesson/[lesson-slug] *    → Lesson Page
│           ├── Konten: teks, gambar, audio
│           ├── Video embed (YouTube / hosted)
│           ├── Tombol: Sebelumnya / Berikutnya
│           ├── Mark as Complete
│           └── /quiz *                → Quiz Page
│               ├── Soal pilihan ganda / isian
│               ├── Timer (opsional)
│               ├── Submit
│               └── /hasil *           → Halaman Hasil Quiz
│                   ├── Skor
│                   ├── Pembahasan jawaban
│                   ├── XP yang didapat
│                   └── CTA: Lanjut Lesson / Ulangi Quiz
│
├── /tryout *                  → Daftar Tryout JLPT
│   └── /[tryout-id] *         → Halaman Tryout
│       ├── Instruksi & durasi
│       ├── Soal (bank soal N5)
│       └── /hasil *           → Hasil Tryout
│           ├── Skor total
│           ├── Breakdown per bagian (Moji, Bunpou, Dokkai)
│           ├── Pembahasan
│           └── XP yang didapat
│
└── /live-class *              → Jadwal Live Class
    ├── Daftar sesi mendatang
    ├── Status: Terdaftar / Belum
    └── Link Zoom (muncul saat sesi aktif)
```

---

## 4. Gamifikasi *

```
/lms/gamifikasi *
├── /profil-saya               → Profil Gamifikasi User
│   ├── Level & XP progress bar
│   ├── Badge yang dimiliki
│   ├── Riwayat perolehan XP (aktivitas)
│   └── Poin saat ini (catatan: redeem manual Fase 1)
│
├── /badge                     → Galeri Badge
│   ├── Badge dimiliki (unlocked)
│   └── Badge belum dimiliki (locked + syarat)
│
└── /leaderboard               → Leaderboard
    ├── Filter: Mingguan / Bulanan
    ├── Ranking berdasarkan XP
    └── Posisi user sendiri (highlighted)
```

---

## 5. Admin Area ***

```
/lms/admin ***
├── /dashboard                 → Admin Dashboard
│   ├── Ringkasan: total user, kursus aktif, submission pending
│   ├── Grafik: registrasi harian, aktivitas belajar
│   └── Quick action: approve konten, tambah kursus
│
├── /user                      → Manajemen User
│   ├── Daftar user + role (student, contributor, admin)
│   ├── Search & filter
│   ├── /[user-id]             → Detail User
│   │   ├── Profil & progress
│   │   ├── Riwayat XP & badge
│   │   └── Tombol: Edit role / Suspend
│   └── /tambah               → Tambah user manual
│
├── /kursus                    → Manajemen Kursus
│   ├── Daftar kursus
│   ├── /tambah                → Form Buat Kursus Baru
│   └── /[course-id]           → Edit Kursus
│       ├── Detail kursus
│       ├── Manajemen lesson
│       └── Urutan silabus
│
├── /lesson                    → Manajemen Lesson
│   ├── Daftar lesson (semua kursus)
│   ├── /tambah                → Form Tambah Lesson
│   └── /[lesson-id]           → Edit Lesson
│       ├── Edit konten
│       ├── Upload video / audio
│       └── Attach quiz
│
├── /quiz                      → Manajemen Quiz & Bank Soal
│   ├── Daftar quiz per kursus/lesson
│   ├── /tambah                → Form Tambah Quiz
│   ├── /[quiz-id]             → Edit Quiz
│   │   ├── Edit soal & pilihan jawaban
│   │   ├── Set bobot XP
│   │   └── Preview quiz
│   └── /bank-soal             → Bank Soal Tryout
│       ├── Daftar soal N5 (100 soal target Fase 1)
│       ├── Filter: tipe, tingkat kesulitan, kategori JLPT
│       └── /tambah-soal       → Form Tambah Soal
│
├── /live-class                → Manajemen Live Class
│   ├── Daftar sesi
│   ├── /tambah                → Form Buat Sesi
│   └── /[session-id]          → Edit Sesi (instruktur, link Zoom, waktu)
│
├── /gamifikasi                → Manajemen Gamifikasi
│   ├── Konfigurasi XP per aktivitas
│   ├── Daftar badge + syarat unlock
│   ├── /badge                 → Edit / tambah badge
│   └── Konfigurasi level & threshold XP
│
├── /pembayaran                → Manajemen Pembayaran Manual
│   ├── Daftar request pembayaran (dari WhatsApp Admin)
│   ├── Konfirmasi manual enroll user ke kursus
│   └── Riwayat transaksi [FASE 2: integrasi payment gateway]
│
└── /analytics                 → Analytics Dashboard
    ├── Google Analytics 4 embed / summary
    ├── Statistik: user aktif, completion rate, quiz score rata-rata
    └── Export laporan (CSV)
```

---

## 6. Akun & Profil *

```
/lms/akun *
├── /profil                    → Edit Profil User
│   ├── Foto, nama, bio singkat
│   └── Simpan perubahan
│
├── /ubah-password             → Ganti Password
├── /notifikasi                → Preferensi Notifikasi
└── /keluar                    → Logout
```

---

## 7. Halaman Statis LMS

```
/lms
├── /tentang                   → Tentang JepangKu LMS
├── /cara-belajar              → Panduan Belajar / How It Works
├── /faq                       → FAQ LMS
└── /hubungi                   → Kontak / WhatsApp Admin
```

---

## Ringkasan Total Halaman Fase 1

| Area | Jumlah Halaman |
|------|----------------|
| Public / Marketing | 5 |
| Auth | 5 |
| Student Area | 10 |
| Gamifikasi | 4 |
| Admin Area | 20 |
| Akun & Profil | 4 |
| Halaman Statis | 4 |
| **Total** | **~52** |

---

## Fitur Ditunda (Fase 2+)

- Payment gateway otomatis
- Redeem poin → uang / voucher otomatis
- Mobile app (iOS / Android)
- Marketplace modul
- Advanced affiliate / creator storefront
- Multi-language interface
- SSO external (Google, LINE)
- Escrow / advanced contributor payout
