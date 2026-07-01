# Admin Bank Soal — Keputusan Arsitektur

| Meta                    | Nilai                  |
| :---------------------- | :--------------------- |
| **Status**              | ✅ Keputusan final MVP |
| **Terakhir diperbarui** | 2026-06-19             |

## Ringkasan

Route sitemap `/admin/quiz` dan `/admin/quiz/import` **tidak** mengimplementasikan CMS bank soal terpusat dan **dihapus dari sidebar admin** (Juni 2026).

| Jenis soal             | Lokasi CMS                                                                                      |
| :--------------------- | :---------------------------------------------------------------------------------------------- |
| **Kuis per pelajaran** | `/admin/kursus → modul → pelajaran → tab Bank Soal` (lesson workspace)                          |
| **Tryout JLPT**        | `/admin/tryout → [sesi] → Soal` — filter level N5–N1 + bagian MOJI_GOI / BUNPOU_DOKKAI / CHOKAI |

## Alasan

1. Soal kuis di schema Prisma terikat `lessonId` — natural fit dengan konten pembelajaran.
2. Soal tryout terikat `tryoutSessionId` + `tryoutLevel` — dikelola per sesi simulasi.
3. Menghindari duplikasi UI dan menu "Bank Soal" global yang membingungkan.

## Route `/admin/quiz` (legacy)

Halaman informasi + redirect ke Kelola Kursus — **tidak** muncul di sidebar.

## Import Excel

Soal kuis lesson dapat diimpor lewat `/admin/kursus/import` (tab **6. Kuis** di formulir Excel).

---

## Import JLPT Tryout — Unified ZIP Format

**Status**: ✅ Implemented July 1, 2026

### Perubahan Dari Format Lama

| Aspek | Lama | Baru |
|-------|------|------|
| Format file | Flat `.xlsx` per section | Single `.zip` dengan multi-sheet Excel |
| MOJI_GOI / BUNPOU | `.xlsx` upload | `jlpt.xlsx` sheet di ZIP |
| CHOKAI | Separate `.zip` upload | `jlpt.xlsx` sheet + `assets/` di ZIP |
| Endpoint | `/import` + `/import-chokai` | Single unified `/import` |
| API detection | Implicit (section column) | Sheet name auto-detection |

### ZIP Structure

```
jlpt-import.zip
├── jlpt.xlsx               (required, at root)
│   ├── Sheet: MOJI_GOI
│   ├── Sheet: BUNPOU_DOKKAI
│   └── Sheet: CHOKAI
└── assets/                 (optional, for CHOKAI media only)
	 ├── soal-001/
	 │   ├── audio.mp3       (required for CHOKAI)
	 │   ├── a.png, b.png, c.png, d.png  (for IMAGE type)
	 │   └── stem.png        (optional)
```

### Sheet Columns

**MOJI_GOI** (kosakata & kanji):
- Pertanyaan, Pilihan A–D, Jawaban Benar, Penjelasan, Audio Group (optional)
- Text-only, no media needed

**BUNPOU_DOKKAI** (tata bahasa):
- Pertanyaan, Options, Jawaban Benar, Penjelasan, Audio Group (optional)
- Options: bisa newline-separated atau pilar A. B. C. D.
- Text-only, no media needed

**CHOKAI** (mendengarkan):
- Folder, Tipe Jawaban (Teks/Gambar), ID Audio, Mulai, Selesai, Pertanyaan, A–D, Jawaban Benar, Penjelasan
- Tipe Teks: isi pertanyaan + pilihan di Excel, audio.mp3 di folder
- Tipe Gambar: a.png–d.png di folder untuk pilihan gambar, label di Excel adalah deskripsi singkat

### Langkah Impor

1. **Download template** → `/admin/tryout → Impor Soal → Unduh Template ZIP`
	- Dapatkan `template-jlpt-import.zip` dengan struktur contoh
2. **Edit jlpt.xlsx**
	- Tambah/ubah baris soal di sheet yang sesuai
	- Untuk CHOKAI: buat folder di `assets/` dengan nama yang sama di Excel
3. **Tambah media** (jika CHOKAI)
	- Setiap folder CHOKAI **wajib** ada `audio.mp3`
	- Tipe Gambar: tambah `a.png`, `b.png`, `c.png`, `d.png`
4. **Kompres** → `jlpt.xlsx` + `assets/` jadi `.zip`
5. **Upload** → Pilih ZIP → Preview → Impor

### Kompatibilitas

- ✅ File lama (flat `.xlsx`) akan ditolak dengan error jelas
- ✅ Endpoint lama `/import-chokai` masih berfungsi (redirect ke unified handler)
- ⚠️ **Admins wajib migrasi** upload format `.xlsx` → `.zip`

### Error Handling

- ZIP tidak ada `jlpt.xlsx` → error "jlpt.xlsx tidak ditemukan di akar ZIP"
- CHOKAI folder di Excel tidak ada di `assets/` → error dengan nomor baris
- CHOKAI Tipe Gambar kurang dari 2 gambar → error validasi
- Sheet tidak dikenal → skip (tidak error, import sheet lain saja)
