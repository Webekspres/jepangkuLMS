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
