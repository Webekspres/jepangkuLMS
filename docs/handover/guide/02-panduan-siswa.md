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
