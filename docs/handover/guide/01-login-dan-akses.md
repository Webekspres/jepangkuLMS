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
