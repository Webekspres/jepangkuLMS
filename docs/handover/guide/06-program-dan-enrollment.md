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
