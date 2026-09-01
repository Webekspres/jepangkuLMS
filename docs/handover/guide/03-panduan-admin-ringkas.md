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
