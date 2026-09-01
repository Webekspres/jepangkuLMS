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
