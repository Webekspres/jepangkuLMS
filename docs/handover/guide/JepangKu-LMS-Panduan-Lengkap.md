---
pdf_options:
  format: A4
  printBackground: true
  margin:
    top: 18mm
    right: 16mm
    bottom: 22mm
    left: 16mm
stylesheet:
  - guide-pdf.css
---

# Panduan Lengkap JepangKu LMS

<div class="cover-meta">

**Platform belajar bahasa Jepang (JLPT N5–N1)**  
kursus.jepangku.com

Serah terima · September 2026

*Buku panduan operasional untuk siswa, sensei/admin, dan staf.*

</div>

<div class="page-break"></div>


---


## Untuk siapa?

| Panduan | Pembaca | Isi |
| :--- | :--- | :--- |
| [01 — Login & Akses](./01-login-dan-akses.md) | Semua | Cara masuk, peran, URL penting |
| [02 — Panduan Siswa](./02-panduan-siswa.md) | Peserta kursus | Belajar, kursus, tryout, pembayaran |
| [03 — Panduan Admin (Ringkas)](./03-panduan-admin-ringkas.md) | Admin / sensei | Menu admin, alur kerja harian |
| [04 — Mengelola Kursus & Pelajaran](./04-mengelola-kursus-dan-pelajaran.md) | **Sensei / pengajar** | Tambah kursus, modul, pelajaran, video, flashcard, kuis |
| [05 — Impor Konten](./05-impor-konten.md) | Admin konten | Impor Excel kursus, ZIP paket tryout |
| [06 — Program & Enrollment](./06-program-dan-enrollment.md) | Admin operasional | Live class, tryout sesi, pembayaran, badge |
| [07 — FAQ & Troubleshooting](./07-faq-troubleshooting.md) | Semua | Pertanyaan umum siswa/admin + siapa hubungi |

---

## URL penting

| Halaman | URL |
| :--- | :--- |
| Beranda publik | `https://kursus.jepangku.com/` |
| Katalog kursus (publik) | `/kursus` |
| Login | `/sign-in` |
| Daftar akun | `/sign-up` |
| Dashboard siswa | `/dashboard` |
| Panel admin | `/admin/dashboard` |

---

## Butuh bantuan teknis?

- Dokumentasi teknis developer: [../README.md](../README.md)
- Status fitur: [../04-implementation-status.md](../04-implementation-status.md)
- Hubungi tim DevOps / admin sistem untuk akses akun admin (`LMS_ADMIN`)

<div class="page-break"></div>

---

# 01 — Login & Akses

## Membuat akun siswa

1. Buka **https://kursus.jepangku.com/sign-up**
2. Isi **nama**, **email**, dan **password**
3. Atau klik **Masuk dengan Google** jika tersedia
4. Setelah berhasil, Anda diarahkan ke **Dashboard** (`/dashboard`)

Akun baru otomatis berperan sebagai **Siswa**.

---

## Login jika sudah punya akun

1. Buka **https://kursus.jepangku.com/sign-in**
2. Masukkan email & password, atau gunakan Google
3. Anda masuk ke **Dashboard**

**Tips:** Jika sebelum login Anda membuka halaman tertentu (mis. detail kursus), sistem akan mengembalikan Anda ke halaman itu setelah login.

---

## Perbedaan Siswa vs Admin

| Peran | Yang bisa diakses | Cara dapat akses |
| :--- | :--- | :--- |
| **Siswa** | `/dashboard/*` — belajar, kursus, tryout, profil | Daftar normal di `/sign-up` |
| **Admin / Sensei** | `/admin/*` — kelola kursus, konten, enrollment | Diberikan role **LMS_ADMIN** oleh tim sistem |

Jika Anda sensei tapi **tidak bisa** buka `/admin`, minta tim DevOps menambahkan role admin ke akun Anda.

---

## Navigasi setelah login (siswa)

Menu utama di sidebar kiri:

| Menu | Fungsi |
| :--- | :--- |
| **Beranda** | Ringkasan progress, lanjut belajar, jalur JLPT |
| **Program → Kursus** | Jelajahi & daftar kursus |
| **Program → Live Class** | Jadwal kelas Zoom |
| **Program → Tryout JLPT** | Simulasi ujian JLPT |
| **Program → Tes Penempatan** | Tes level awal |
| **Leaderboard** | Peringkat poin LMS |
| **Artikel** | Portal berita JepangKu (tab baru) |

Profil & pengaturan: klik **avatar/nama** di pojok kanan atas.

---

## Navigasi admin

Setelah login sebagai admin, buka **https://kursus.jepangku.com/admin/dashboard**

Menu sidebar admin (grup):

| Grup | Menu |
| :--- | :--- |
| **Overview** | Dashboard, Pengaturan |
| **Siswa & Akses** | Enrollment, Pembayaran, Pengguna |
| **Kurikulum** | Kursus, Import Kursus |
| **Program** | Live Class, JLPT Tryout, Paket Soal JLPT |
| **Gamifikasi** | Badge |

Detail tiap menu: [03 — Panduan Admin Ringkas](./03-panduan-admin-ringkas.md).

---

## Keluar (logout)

Klik **avatar** → **Keluar** (Sign out).

---

## Masalah umum

| Gejala | Solusi |
| :--- | :--- |
| Lupa password | Gunakan **Lupa password?** di halaman login Clerk |
| Tidak bisa akses `/admin` | Akun belum punya role admin — hubungi tim |
| Halaman kosong setelah login | Refresh; pastikan koneksi internet stabil |
| XP/level tidak muncul | Fitur gamifikasi butuh koneksi ke Core — coba logout & login lagi |

<div class="page-break"></div>

---

# 02 — Panduan Siswa

Panduan untuk peserta kursus yang belajar di JepangKu LMS.

---

## 1. Dashboard (Beranda)

Setelah login, Anda land di **Beranda** (`/dashboard`).

Di sini Anda bisa:

- Melihat **Lanjutkan Belajar** — kursus terakhir yang dikerjakan
- Melihat **Jalur JLPT Saya** — progress tryout per level (N5–N1)
- Melihat **XP mingguan** dan ringkasan aktivitas
- Akses cepat ke Live Class & Tryout

---

## 2. Mendaftar & mengikuti kursus

### Menjelajahi kursus

1. Menu **Program → Kursus** (`/dashboard/kursus`)
2. Gunakan **search** dan **filter** level JLPT / tipe kursus
3. Klik kartu kursus untuk detail

### Mendaftar

| Situasi | Tombol | Yang terjadi |
| :--- | :--- | :--- |
| Belum terdaftar | **Daftar Kursus** | Buka detail → ajukan enrollment |
| Kursus **gratis** | Daftar | Akses langsung aktif |
| Kursus **berbayar** | Daftar / Bayar | Diarahkan ke **checkout** Midtrans |
| Sudah terdaftar, progress 0% | **Mulai Belajar** | Ke pelajaran pertama |
| Sudah terdaftar, ada progress | **Lanjutkan Belajar** | Ke pelajaran terakhir |

### Kursus saya

Semua kursus yang **sudah Anda daftar** ada di **Kursus Saya** (`/dashboard/kursus-saya`) — akses dari menu profil.

---

## 3. Belajar (workspace pelajaran)

Alur: **Kursus → Modul → Pelajaran**

1. Buka kursus → klik **Mulai/Lanjutkan Belajar**
2. Anda masuk workspace: `/dashboard/belajar/[kursus]/[pelajaran]`

### Jenis pelajaran

| Tipe | Yang Anda lihat |
| :--- | :--- |
| **Video** | Pemutar video YouTube + catatan |
| **Flashcard** | Kartu kosakata/kanji/tata bahasa — balik kartu, shuffle |
| **Quiz** | Soal pilihan ganda — jawab lalu submit |
| **Teks** | Materi bacaan |

### Sidebar kursus

- Daftar modul & pelajaran di kiri
- Centang hijau = pelajaran selesai
- Navigasi **Sebelumnya / Berikutnya** di bawah

### Q&A (tanya jawab)

Di bawah materi video, Anda bisa:

- Menulis **komentar** atau **balasan**
- Menyebut user lain dengan **@mention**
- Menghapus komentar **milik sendiri**

---

## 4. Tryout JLPT

1. **Program → Tryout JLPT** (`/dashboard/tryout`)
2. Pilih **sesi tryout** yang tersedia
3. Jika berbayar → checkout dulu
4. Klik **Mulai Ujian** → mode fokus (layar penuh, timer)
5. Kerjakan per **blok** (Moji-Goi, Bunpou/Dokkai, Choukai)
6. Submit → lihat **hasil & analisa** per bagian

**Choukai (listening):** audio diputar otomatis; ikuti instruksi di layar.

Riwayat hasil tersimpan — membantu **Jalur JLPT** di dashboard.

---

## 5. Live Class

1. **Program → Live Class** (`/dashboard/live-class`)
2. Lihat jadwal kelas
3. Klik detail → **Daftar** (gratis/berbayar)
4. Saat sesi aktif: tombol **Gabung Zoom** atau link rekaman

---

## 6. Tes Penempatan

1. **Program → Tes Penempatan**
2. Baca info → **Mulai Tes**
3. Kerjakan soal (UI mirip tryout)
4. Lihat **rekomendasi level** di halaman hasil

> Catatan: sebagian asset audio/gambar masih dalam pengembangan.

---

## 7. Kana (Hiragana & Katakana)

- Akses dari **FAB (tombol mengambang)** di beranda/program list/profil
- Atau langsung: `/dashboard/kana/hiragana` dan `/dashboard/kana/katakana`
- Klik huruf → modal detail (audio, stroke, contoh kosakata)

---

## 8. Gamifikasi

| Fitur | Lokasi | Keterangan |
| :--- | :--- | :--- |
| **XP & Level** | Dashboard, profil | Dari sistem JepangKu Core |
| **Leaderboard** | `/dashboard/leaderboard` | Peringkat poin LMS |
| **Badge & Achievements** | `/dashboard/achievements` | Koleksi badge + milestone JLPT |
| **Profil** | `/dashboard/profil` | Edit nama tampilan, foto, badge title |

Anda mendapat **XP** saat: menyelesaikan pelajaran, kuis, tryout, login harian, unlock badge.

---

## 9. Pembayaran

### Checkout

1. Pilih produk berbayar (kursus / live class / tryout)
2. Diarahkan ke `/dashboard/checkout/...`
3. **Mode Snap:** popup Midtrans langsung muncul
4. **Mode Core:** pilih metode bayar (QRIS, GoPay, dll.)
5. Selesai bayar → enrollment **aktif otomatis** (via webhook)

### Riwayat

- **Riwayat Pembayaran** (`/dashboard/pembayaran`)
- Klik transaksi → detail + **Cek status** jika masih pending
- Jika sudah **PAID** → unduh **Invoice PDF**

---

## 10. Tips belajar efektif

1. Kerjakan pelajaran **berurutan** — modul berikutnya terbuka setelah progress tercatat
2. Selesaikan **kuis** di akhir modul untuk mengunci pemahaman
3. Ikuti **tryout** berkala untuk lacak kesiapan JLPT
4. Manfaatkan **flashcard** untuk hafalan kosakata harian
5. Aktifkan notifikasi email untuk reminder **Live Class**

<div class="page-break"></div>

---

# 03 — Panduan Admin (Ringkas)

Panduan untuk **admin**, **sensei**, dan staf yang mengelola JepangKu LMS.

**Akses:** login → buka `/admin/dashboard` (butuh role **LMS_ADMIN**).

---

## Peta menu admin

### Overview

| Menu | URL | Fungsi |
| :--- | :--- | :--- |
| **Dashboard** | `/admin/dashboard` | KPI, grafik enrollment, aktivitas, tren tryout/live class |
| **Pengaturan** | `/admin/settings` | Integrasi Google Analytics & Search Console |

### Siswa & Akses

| Menu | URL | Fungsi |
| :--- | :--- | :--- |
| **Enrollment** | `/admin/pembayaran` | Antrian pendaftaran + riwayat approve/reject/grant |
| **Pembayaran** | `/admin/metode-pembayaran` | Toggle metode bayar (hanya mode Core API; disembunyikan jika Snap) |
| **Pengguna** | `/admin/users` | Daftar user, detail enrollment per program |

### Kurikulum

| Menu | URL | Fungsi |
| :--- | :--- | :--- |
| **Kursus** | `/admin/kursus` | CRUD kursus, modul, pelajaran |
| **Import Kursus** | `/admin/kursus/import` | Impor workbook Excel (bulk) |

### Program

| Menu | URL | Fungsi |
| :--- | :--- | :--- |
| **Live Class** | `/admin/live-class` | CRUD jadwal kelas Zoom |
| **JLPT Tryout** | `/admin/tryout` | CRUD sesi tryout (event) |
| **Paket Soal JLPT** | `/admin/tryout/paket` | Authoring bank soal ujian (utama) |

### Gamifikasi

| Menu | URL | Fungsi |
| :--- | :--- | :--- |
| **Badge** | `/admin/badges` | Katalog badge + riwayat unlock + tombol **Beri Badge** |

---

## Alur kerja harian (sensei)

```text
1. Buat / pilih Kursus
      ↓
2. Tambah Modul (bab)
      ↓
3. Tambah Pelajaran per modul
      ↓
4. Isi konten di Lesson Workspace (video / flashcard / kuis)
      ↓
5. Preview sebagai siswa
      ↓
6. Publish kursus (status published)
```

Detail langkah 1–5: [04 — Mengelola Kursus & Pelajaran](./04-mengelola-kursus-dan-pelajaran.md)

---

## Alur kerja tryout (admin ujian)

```text
1. Buat Paket Soal (atau Import ZIP)
      ↓
2. Isi soal per bagian (Moji-Goi, Bunpou, Choukai)
      ↓
3. Set status paket → READY
      ↓
4. Buat Sesi Tryout → pilih paket → Activate
```

Detail: [05 — Impor Konten](./05-impor-konten.md) dan [06 — Program & Enrollment](./06-program-dan-enrollment.md)

---

## Alur enrollment siswa

| Cara siswa dapat akses | Admin perlu |
| :--- | :--- |
| Daftar kursus **gratis** | Tidak perlu approve (auto ACTIVE) |
| Bayar via Midtrans | Webhook auto-settle; cek tab **Antrian** jika stuck |
| Transfer / manual (legacy) | Approve di **Enrollment → Antrian** |
| Grant manual admin | **Grant** enrollment dari dialog peserta atau halaman user |

---

## Pratinjau sebagai siswa

Di hampir semua halaman konten admin ada tombol **Preview siswa** — membuka tab baru ke tampilan `/dashboard/belajar/...` yang sama seperti dilihat siswa.

---

## Tips admin

1. **Simpan sering** — setiap form punya tombol Simpan; perhatikan banner hijau/merah
2. **Slug kursus/pelajaran** — otomatis dari judul; bisa diedit (hanya huruf kecil, angka, strip)
3. **Urutan modul/pelajaran** — bisa di-drag (DnD) di halaman daftar
4. **Pagination** — tabel admin punya footer halaman (5/10/15/25/100 per halaman)
5. **Jangan hapus** kursus/sesi yang masih punya peserta aktif tanpa koordinasi tim

---

## Panduan lanjutan

| Topik | Dokumen |
| :--- | :--- |
| Tambah pelajaran, video, flashcard, kuis | [04 — Mengelola Kursus & Pelajaran](./04-mengelola-kursus-dan-pelajaran.md) |
| Impor Excel / ZIP | [05 — Impor Konten](./05-impor-konten.md) |
| Live class, tryout sesi, pembayaran, badge | [06 — Program & Enrollment](./06-program-dan-enrollment.md) |

<div class="page-break"></div>

---

# 04 — Mengelola Kursus & Pelajaran

Panduan **utama untuk sensei** yang ingin menambah atau mengubah materi belajar.

**Mulai dari:** Admin → **Kursus** (`/admin/kursus`)

---

## 1. Membuat kursus baru

1. Buka `/admin/kursus`
2. Klik **Tambah Kursus** (atau tombol serupa)
3. Isi form:

| Field | Keterangan |
| :--- | :--- |
| **Judul** | Nama kursus (mis. "JLPT N5 — Dasar") |
| **Slug / Kode** | URL-friendly; otomatis dari judul, bisa diedit |
| **Level JLPT** | N5, N4, N3, N2, N1 |
| **Tipe kursus** | Utama / Gratis / Tambahan |
| **Deskripsi** | Ringkasan untuk halaman marketing |
| **Yang akan dipelajari** | Outcomes — satu poin per baris |
| **Harga (IDR)** | `0` = gratis |
| **Cover image** | Upload gambar cover (opsional) |
| **Published** | Centang agar muncul di katalog publik |

4. Klik **Simpan**

---

## 2. Menambah modul (bab)

1. Dari daftar kursus → klik **Modul** pada baris kursus
2. Atau buka `/admin/kursus/[courseId]/modul`
3. Klik **Tambah Modul**
4. Isi **judul**, **slug**, **deskripsi**, **urutan**
5. Simpan

**Mengubah urutan:** drag-and-drop baris modul di tabel.

---

## 3. Menambah pelajaran (lesson)

1. Dari halaman modul → klik **Pelajaran**
2. Klik **Tambah Pelajaran**
3. Isi:

| Field | Keterangan |
| :--- | :--- |
| **Judul** | Nama pelajaran |
| **Slug** | Untuk URL belajar |
| **Tipe pelajaran** | Video / Flashcard / Quiz / Teks |
| **Urutan** | Posisi dalam modul |

4. Simpan → Anda masuk **Lesson Workspace**

---

## 4. Lesson Workspace — tab Informasi

URL: `/admin/kursus/[courseId]/modul/[moduleId]/lesson/[lessonId]`

Tab **Informasi** — pengaturan dasar pelajaran:

| Tipe | Field yang relevan |
| :--- | :--- |
| **Video** | URL video YouTube, catatan/intro (Markdown) |
| **Flashcard** | Judul & urutan saja (kartu di tab Flashcard) |
| **Quiz** | Judul & urutan (soal di tab Bank Soal) |
| **Teks** | Konten bacaan (Markdown) |

**Tombol Preview siswa** (kanan atas) — buka tampilan siswa di tab baru.

---

## 5. Tab Flashcard (tipe Flashcard)

Sub-tab: **Kosakata** | **Kanji** | **Tata Bahasa**

### Kosakata

| Kolom | Contoh |
| :--- | :--- |
| Kanji / Kana | 食べる |
| Reading | たべる |
| Arti | makan |
| Contoh kalimat | ごはんを食べます |

### Kanji

| Kolom | Contoh |
| :--- | :--- |
| Kanji | 食 |
| Onyomi / Kunyomi | ショク / た |
| Arti | makan |
| Contoh | 食事 |

### Tata Bahasa

| Kolom | Contoh |
| :--- | :--- |
| Pola | 〜てください |
| Penjelasan | Permintaan sopan |
| Contoh | 座ってください |

**Menambah baris:** klik **Tambah** di masing-masing sub-tab → isi form → Simpan.

**Edit / Hapus:** ikon pensil / hapus di kolom aksi tabel.

---

## 6. Tab Bank Soal (tipe Quiz)

Soal kuis **per pelajaran** — bukan bank global.

1. Buka tab **Bank Soal**
2. Klik **Tambah Soal**
3. Isi:
   - **Pertanyaan**
   - **Pilihan A, B, C, D**
   - **Jawaban benar** (A/B/C/D)
   - **Penjelasan** (opsional, tampil setelah submit)
4. Simpan

Siswa mengerjakan kuis di workspace belajar; skor tercatat di `QuizAttempt`.

> **Catatan:** Route `/admin/quiz` di sidebar **tidak ada** — soal kuis hanya di lesson workspace ini.

---

## 7. Tipe pelajaran — ringkasan

| Tipe | Tab admin | Tampilan siswa |
| :--- | :--- | :--- |
| **Video** | Informasi | Pemutar YouTube + Q&A |
| **Flashcard** | Informasi + Flashcard | Kartu 3D flip |
| **Quiz** | Informasi + Bank Soal | Kuis pilihan ganda |
| **Teks** | Informasi | Halaman bacaan |
| **Legacy** | Semua tab | Campuran (kursus lama) |

---

## 8. Melihat daftar peserta kursus

1. Di tabel kursus → kolom **Peserta**
2. Klik angka peserta → dialog daftar siswa
3. Dari dialog bisa **Approve**, **Cabut**, atau **Grant** akses

---

## 9. Checklist sebelum publish

- [ ] Semua modul & pelajaran punya judul jelas
- [ ] Video: URL YouTube valid & bisa diputar
- [ ] Flashcard: minimal beberapa kartu per sub-tipe
- [ ] Quiz: minimal 1 soal dengan jawaban benar terisi
- [ ] Kursus di-set **Published**
- [ ] Preview siswa sudah dicek di mobile & desktop
- [ ] Harga sudah benar (0 untuk gratis)

---

## 10. Mengubah / menghapus konten

| Aksi | Lokasi |
| :--- | :--- |
| Edit kursus | `/admin/kursus` → ikon edit |
| Edit modul | Halaman modul → edit |
| Edit pelajaran | Lesson workspace → tab Informasi |
| Hapus pelajaran | Halaman daftar pelajaran → hapus (konfirmasi) |
| Hapus modul/kursus | Hati-hati — bisa affect enrollment & progress siswa |

**Saran:** untuk revisi besar, duplikasi struktur via **Import Kursus** (mode replace) daripada hapus manual — koordinasi dengan tim dev.

---

## Alternatif: impor bulk

Jika sensei punya workbook Excel siap (template resmi atau sensei N4/N5):

→ Lihat [05 — Impor Konten](./05-impor-konten.md)

Impor bulk cocok untuk **puluhan pelajaran sekaligus**, bukan satu pelajaran tunggal.

<div class="page-break"></div>

---

# 05 — Impor Konten

Panduan impor **bulk** untuk kursus (Excel) dan paket soal tryout (ZIP).

---

## A. Impor Kursus (Excel)

**Lokasi:** Admin → **Import Kursus** (`/admin/kursus/import`)

### Kapan pakai impor?

- Sensei sudah punya workbook Excel terstruktur (banyak modul & pelajaran)
- Migrasi konten dari template resmi `official-course-v1`
- Update massal konten N4/N5 dari workbook sensei

### Langkah-langkah

1. Buka `/admin/kursus/import`
2. **Unduh template** — pilih template yang sesuai (resmi atau sensei N4/N5)
3. Isi workbook di Excel:
   - Sheet struktur kursus (modul, pelajaran)
   - Sheet materi (kosakata, kanji, tata bahasa)
   - Sheet quiz (jika ada)
4. Kembali ke halaman import → **Dropzone** → pilih file `.xlsx`
5. Klik **Pratinjau** (dry-run):
   - Periksa badge template terdeteksi
   - Baca daftar **error** (merah) dan **warning** (kuning)
   - Lihat tabel preview struktur modul/pelajaran
6. Jika preview OK → klik **Impor ke DB**
7. Unduh **laporan `.txt`** jika perlu arsip

### Mode impor

| Mode | Efek |
| :--- | :--- |
| **Replace** | Ganti konten kursus target sesuai workbook (hati-hati) |
| **Merge / update** | Tergantung template — baca panduan di halaman import |

### Error umum

| Error | Penyebab | Solusi |
| :--- | :--- | :--- |
| Sheet tidak dikenali | Nama sheet salah | Pakai template resmi |
| Baris dilewati | Kolom wajib kosong | Isi kolom merah di preview |
| Kursus tidak ditemukan | Slug/kode tidak match | Buat kursus dulu atau perbaiki kode di Excel |
| Rollback | Validasi gagal saat commit | Perbaiki error lalu impor ulang |

Detail teknis: [COURSE_IMPORT_ARCHITECTURE.md](../../COURSE_IMPORT_ARCHITECTURE.md)

---

## B. Impor Paket Soal Tryout (ZIP)

**Lokasi:** Admin → **Paket Soal JLPT** → **Import Paket** (`/admin/tryout/paket/import`)

### Konsep

- **1 file ZIP = 1 paket soal** (bukan per sesi)
- Sesi tryout **memilih** paket yang sudah READY
- Format: Excel multi-sheet + folder `assets/` untuk audio/gambar Choukai

### Struktur ZIP

```text
paket-n5-contoh.zip
├── jlpt.xlsx                    (wajib di akar ZIP)
│   ├── Sheet: 004. Moji Goi     (atau MOJI_GOI)
│   ├── Sheet: 005. Bunpou Dokkai
│   └── Sheet: 006. Choukai
└── assets/                      (opsional, untuk Choukai)
    └── soal-001/
        ├── audio.mp3            (wajib untuk Choukai)
        ├── a.png, b.png, ...    (jika tipe jawaban Gambar)
        └── stem.png             (opsional)
```

### Langkah-langkah

1. **Unduh template ZIP** dari halaman import paket
2. Edit `jlpt.xlsx`:
   - **Moji Goi:** Pertanyaan, A–D, Jawaban Benar, Penjelasan
   - **Bunpou/Dokkai:** sama; pilihan bisa multi-baris
   - **Choukai:** Folder, Tipe Jawaban (Teks/Gambar), timestamp audio, pertanyaan, A–D
3. Untuk baris Choukai → buat folder matching di `assets/`
4. Kompres `jlpt.xlsx` + `assets/` menjadi `.zip`
5. Upload → **Pratinjau** → periksa jumlah soal per bagian
6. **Impor ke DB**

### Setelah impor

1. Buka detail paket → `/admin/tryout/paket/[setId]`
2. Review soal per tab level/bagian
3. Tambah/edit soal manual jika perlu (Moji, Bunpou, Choukai + upload audio)
4. Set status paket → **READY**

### Choukai — tips

- **1 audio master** per paket; soal pakai timestamp **Mulai** / **Selesai**
- Upload audio master di CMS paket (bukan per-soal kecuali asset pendukung)
- Tipe **Gambar:** siapkan `a.png`–`d.png` di folder asset

Detail: [JLPT_BANK_IMPORT_SPEC.md](../../JLPT_BANK_IMPORT_SPEC.md), [ADMIN_QUIZ.md](../../ADMIN_QUIZ.md)

---

## C. Perbandingan: manual vs impor

| Situasi | Rekomendasi |
| :--- | :--- |
| 1–3 pelajaran baru | **Manual** — [04 — Mengelola Kursus](./04-mengelola-kursus-dan-pelajaran.md) |
| Satu modul lengkap (10+ pelajaran) | **Impor Excel** |
| Bank soal tryout 50+ item | **Impor ZIP paket** |
| Koreksi typo 1 soal | Edit langsung di lesson workspace / detail paket |

---

## D. Checklist QA setelah impor

- [ ] Preview import **0 error**
- [ ] Random sample 3 pelajaran → Preview siswa
- [ ] Quiz: jawaban benar match di DB
- [ ] Tryout Choukai: audio terdengar di mode ujian
- [ ] Slug URL tidak bentrok
- [ ] Simpan laporan import `.txt` untuk arsip tim

<div class="page-break"></div>

---

# 06 — Program & Enrollment

Panduan admin untuk **Live Class**, **Tryout sesi**, **Enrollment/Pembayaran**, dan **Badge**.

---

## A. Live Class

**Menu:** Admin → **Live Class** (`/admin/live-class`)

### Membuat live class

1. Klik **Tambah Live Class**
2. Isi:

| Field | Keterangan |
| :--- | :--- |
| Judul | Nama kelas |
| Deskripsi | Info untuk siswa |
| Kategori | Filter di katalog siswa |
| Harga | 0 = gratis |
| Cover image | Upload (opsional) |
| Jadwal sesi | Tanggal, waktu, durasi |
| Zoom URL | Link meeting (jangan tampil ke publik sebelum enrollment) |
| Published | Tampil di katalog |

3. Simpan

### Sesi dalam live class

- Satu live class bisa punya **beberapa sesi** (minggu 1, minggu 2, …)
- Status sesi: terjadwal / live / rekaman tersedia
- **Rekaman:** isi URL rekaman setelah sesi selesai

### Peserta

- Kolom **Peserta** di tabel → klik untuk lihat daftar siswa
- Approve / cabut enrollment dari dialog

### Email reminder

Sistem mengirim reminder harian (cron) ke siswa terdaftar ACTIVE — otomatis, tidak perlu aksi manual.

---

## B. JLPT Tryout — Paket & Sesi

### Konsep

| Istilah | Arti |
| :--- | :--- |
| **Paket Soal** | Kumpulan soal ujian (authoring) |
| **Sesi Tryout** | Event/jadwal ujian yang siswa daftar |
| **Bank Soal** | Atom soal — sekarang terpusat di **Paket Soal** |

### Workflow lengkap

```text
Buat Paket Soal → isi soal → status READY
        ↓
Buat Sesi Tryout → pilih level (N5–N1) → pilih Paket
        ↓
Set harga, jadwal, published → Activate sesi
        ↓
Siswa daftar & ujian di /dashboard/tryout
```

### Paket Soal (`/admin/tryout/paket`)

1. **Buat paket** — kode unik (mis. `n5-paket-1`), level JLPT
2. **Detail paket** — tab per bagian:
   - N5–N3: Moji-Goi, Bunpou/Dokkai, Choukai (3 bagian)
   - N1–N2: Vocab/Grammar (gabung), Reading, Choukai (2+1)
3. Tambah soal manual atau [impor ZIP](./05-impor-konten.md)
4. Upload **audio master Choukai** jika ada bagian listening
5. Status: `DRAFT` → `READY` (minimal 1 soal valid)

**Soft lock:** jika paket dipakai sesi **aktif**, edit item dibatasi — duplikasi paket untuk revisi besar.

### Sesi Tryout (`/admin/tryout`)

1. **Tambah sesi** — kode sesi, level, deskripsi, harga
2. Pilih **Paket Soal** dari dropdown (hanya paket READY + level match)
3. **Activate** (`isActive=true`) — validasi: paket punya semua bagian JLPT terisi
4. Kolom **Peserta** → monitor siapa sudah mengerjakan

### Hasil tryout siswa

Admin bisa lihat partisipasi via dialog peserta. Analisa detail ada di sisi siswa: `/dashboard/tryout/hasil/[attemptId]`.

---

## C. Enrollment & Pembayaran

**Menu:** Admin → **Enrollment** (`/admin/pembayaran`)

### Tab Antrian

Menampilkan enrollment **PENDING** — menunggu pembayaran atau approval.

| Aksi | Kapan |
| :--- | :--- |
| **Setujui** | Transfer manual / kasus khusus (Midtrans auto-settle biasanya tidak perlu) |
| **Tolak** | Data invalid / pembayaran tidak sah |
| **Grant** | Beri akses gratis tanpa bayar |
| **Hapus antrean** | Payment terminal (expire/cancel) — bersihkan antrian |

> **Penting:** Enrollment Midtrans yang sudah **PAID** via webhook **jangan** di-approve manual — sudah otomatis ACTIVE.

### Tab Riwayat

Log semua aksi: REQUESTED, APPROVED, REJECTED, GRANTED, REVOKED — dengan filter & pencarian.

### Grant enrollment manual

Dari **Enrollment** atau **Pengguna** → pilih produk (Kursus / Live Class / Tryout) → **Grant**.

Berguna untuk: beasiswa, tim internal, koreksi error pembayaran.

### Metode pembayaran

**Menu:** Admin → **Pembayaran** (`/admin/metode-pembayaran`)

- Hanya muncul jika `PAYMENT_CHECKOUT_MODE=core`
- Toggle QRIS, GoPay, VA bank, dll. untuk picker siswa
- Mode **Snap:** metode dikelola di dashboard Midtrans (MAP), menu ini disembunyikan

---

## D. Badge (Gamifikasi LMS)

**Menu:** Admin → **Badge** (`/admin/badges`)

### Katalog badge

- Lihat semua badge LMS (icon, rarity, syarat unlock)
- **Tambah badge** — form dengan:
  - Nama, deskripsi, gambar (upload R2)
  - **Syarat unlock:** FIRST_LESSON, QUIZ_PASS, TRYOUT_COMPLETE, SPECIFIC_LESSON_COMPLETE, dll.
  - Field kondisional: pilih kursus/modul/lesson target jika syarat spesifik

### Beri badge manual

1. Di halaman Badge → tombol **Beri Badge**
2. Pilih user + badge dari katalog
3. Simpan → siswa dapat notifikasi

### Tab Riwayat

- Badge dari **aturan otomatis** vs **grant admin**
- Pagination & filter

**Catatan:** XP/level global tetap dari **Core Backend** — badge LMS adalah achievement platform kursus.

---

## E. Pengguna

**Menu:** Admin → **Pengguna** (`/admin/users`)

- Cari user by nama/email
- Klik detail → lihat enrollment kursus, live class, tryout
- Grant/cabut akses per program

---

## F. Pengaturan analitik

**Menu:** Admin → **Pengaturan** (`/admin/settings`)

- Pasang **Google Analytics 4** measurement ID
- Pasang **Google Search Console** verification
- Data tampil/terhubung ke executive dashboard

---

## Ringkasan tanggung jawab admin

| Tugas | Frekuensi | Menu |
| :--- | :--- | :--- |
| Tambah materi pelajaran | Harian/mingguan | Kursus → Lesson workspace |
| Monitor pembayaran pending | Harian | Enrollment → Antrian |
| Siapkan sesi tryout baru | Per event JLPT | Paket Soal → Sesi Tryout |
| Jadwal live class | Mingguan | Live Class |
| Grant akses khusus | Ad-hoc | Enrollment / Pengguna |
| Review dashboard KPI | Mingguan | Dashboard |

<div class="page-break"></div>

---

# 07 — FAQ & Troubleshooting

Jawaban cepat untuk pertanyaan siswa, sensei, dan admin. Orientasi **helpdesk** — bukan debug developer.

---

## A. Login & akun

### Saya lupa password

Gunakan **Lupa password?** di halaman `/sign-in`. Reset via email Clerk.

### Sudah daftar tapi tidak bisa login

1. Cek email sudah diverifikasi (Clerk)
2. Coba **Masuk dengan Google** jika daftar pakai Google
3. Hubungi admin jika akun perlu di-reset manual (Clerk dashboard — tim DevOps / Core Backend)

### Sensei tidak bisa buka `/admin`

1. Pastikan sudah login sebagai user yang benar
2. Role harus **LMS_ADMIN** — minta admin lain set di `/admin/users` → Role → Admin
3. Atau minta **tim Core Backend** set role di JWT/SSO
4. Bukan masalah "belum daftar kursus" — admin terpisah dari enrollment siswa

---

## B. Kursus & belajar

### Siswa sudah bayar/daftar tapi kursus masih terkunci

1. Cek **Enrollment** status harus **ACTIVE** (admin: `/admin/pembayaran` atau dialog peserta kursus)
2. Pembayaran Midtrans **PENDING** → tunggu webhook atau klik **Cek status** di riwayat pembayaran
3. Admin bisa **Grant** manual jika pembayaran sudah confirmed di luar sistem

### Video tidak bisa diputar

1. Cek koneksi internet siswa
2. Video YouTube — pastikan URL valid & tidak private di admin lesson workspace
3. Coba browser lain / non-incognito
4. Enrollment harus ACTIVE untuk konten terproteksi

### Progress / centang hijau tidak muncul

1. Pastikan siswa klik **Selesai** / submit kuis sampai akhir
2. Refresh halaman belajar
3. Jika masih stuck — laporkan ke admin dengan **slug kursus + pelajaran**

### Flashcard kosong

Admin belum isi tab **Flashcard** di lesson workspace — sensei harus tambah kosakata/kanji/tata bahasa.

---

## C. Pembayaran

### Status pembayaran stuck "Pending"

1. Siswa: buka `/dashboard/pembayaran` → detail transaksi → **Cek status**
2. E-wallet: pastikan siswa kembali ke app setelah bayar (GoPay dll.)
3. QRIS: scan dalam waktu expired
4. Admin: cek Midtrans dashboard — apakah settlement sudah masuk
5. **Jangan** approve manual enrollment Midtrans yang seharusnya auto-settle — risiko double

### Snap popup tidak muncul

1. Cek ad-blocker / browser block popup
2. Coba **Lanjutkan** dari riwayat pembayaran (`?resume=1`)
3. Admin: pastikan `MIDTRANS_SERVER_KEY` ter-set di env production

### Sudah bayar tapi invoice belum ada

Invoice hanya untuk status **PAID** — `/dashboard/pembayaran/[id]/invoice`

---

## D. Tryout & live class

### Tidak bisa mulai tryout

1. Harus **terdaftar** sesi tryout (enrollment ACTIVE)
2. Sesi harus **aktif** (`isActive`) — admin: `/admin/tryout`
3. Berbayar → selesaikan checkout dulu

### Audio Choukai tidak terdengar

1. Cek volume browser & perangkat
2. Admin: pastikan **audio master** ter-upload di paket soal
3. Coba headphone — beberapa browser block autoplay

### Live class — tombol Zoom tidak ada

1. Enrollment harus ACTIVE
2. Sesi belum mulai → tombol muncul saat jadwal aktif
3. Admin: isi **Zoom URL** di CMS live class

---

## E. Gamifikasi (XP, badge, leaderboard)

### XP tidak naik setelah selesai kuis

1. Logout & login lagi (sync Core JWT)
2. XP global dari **Core Backend** — bisa delay jika Core sementara down; progress kursus lokal tetap tersimpan
3. Developer: cek `LmsXpEvent.coreStatus` — bukan concern sensei

### Leaderboard kosong / tidak update

1. Butuh aktivitas siswa lain + poin LMS
2. Leaderboard global Core — issue lintas tim → **tim Core Backend**

### Badge tidak unlock padahal syarat sudah dipenuhi

1. Cek rule badge di `/admin/badges` (lesson/modul/kursus target benar?)
2. Admin bisa **Grant** manual dari halaman Badge

---

## F. Impor konten (admin)

### Impor kursus Excel error banyak

1. Baca preview — baris/sheet yang merah
2. Pakai **template resmi** dari halaman import
3. Unduh laporan `.txt` untuk detail
4. Jangan impor ke production sebelum preview bersih di staging

### Impor ZIP tryout gagal

1. Pastikan `jlpt.xlsx` di **akar** ZIP
2. Folder Choukai di `assets/` harus match nama di Excel
3. Setiap folder Choukai wajib punya `audio.mp3`

---

## G. Kapan hubungi siapa?

| Masalah | Hubungi dulu |
| :--- | :--- |
| Cara tambah pelajaran, isi kuis | Sensei lead / baca PDF panduan |
| Pembayaran siswa stuck >24 jam | Admin enrollment + DevOps (Midtrans) |
| Website down / error 502 | DevOps |
| Login SSO aneh semua user | Tim Core Backend / DevOps (Clerk) |
| Bug fitur / error di layar | Tim dev LMS |
| Konten tes penempatan belum lengkap | Tim produk/konten |

---

## H. Info yang selalu sertakan saat lapor bug

1. URL halaman (copy dari address bar)
2. Akun email (tanpa password)
3. Langkah reproduce: "klik A → B → error"
4. Screenshot jika bisa
5. Browser & perangkat (Chrome mobile, dll.)
6. Waktu kejadian (WIB)

<div class="page-break"></div>
