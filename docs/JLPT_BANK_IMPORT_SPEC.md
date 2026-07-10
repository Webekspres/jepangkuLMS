# JLPT Paket Soal — ZIP Import Spec

One ZIP = **one Paket Soal**. Import upserts bank atoms and **replaces** that package’s item list in one transaction.

## Package layout

```text
import.zip
  BACA-SAYA.txt
  workbook.xlsx
  audio/
    contoh-chokai.mp3
  images/
    contoh-gambar.png
```

## Sheets (template admin-friendly)

| Tab | Isi |
|-----|-----|
| `001. Panduan` | Panduan lengkap |
| `002. Paket` | Satu baris identitas paket |
| `003. Audio Chokai` | Cuplikan audio (opsional) |
| `004. Moji Goi` | Soal kosakata & kanji + A–D |
| `005. Bunpou Dokkai` | Soal tata bahasa & bacaan + A–D |
| `006. Choukai` | Soal mendengar + Kode Audio + A–D + Gambar Stimulus |

Soal **dipisah per section ujian**. Kolom «Bagian» tidak perlu — section diambil dari nama tab.

**Legacy:** sheet `Soal` / `Questions` terpadu + sheet `Options` masih diterima.

### 002. Paket

| Kolom | Wajib | Catatan |
|-------|-------|---------|
| Kode Paket | ya | `n5-paket-1` |
| Judul | ya | |
| Level | ya | N5–N1 |
| Status | ya | `DRAFT` / `READY` / `ARCHIVED` |

### 003. Audio Chokai

| Kolom | Wajib | Catatan |
|-------|-------|---------|
| Kode Audio | ya | Harus sama di tab 006 |
| Level | ya | |
| Nama File Audio | ya | Di folder `audio/` |
| Mulai / Selesai | tidak | Cuplikan opsional |
| Instruksi | tidak | |

### 004. Moji Goi / 005. Bunpou Dokkai

| Kolom | Wajib | Catatan |
|-------|-------|---------|
| Kode Soal | ya | |
| Level | ya | |
| Pertanyaan | ya | |
| A–D | min A+B | |
| Jawaban Benar | ya | Dropdown A–D |
| Tipe Jawaban | ya | Biasanya `Teks` |

### 006. Choukai

| Kolom | Wajib | Catatan |
|-------|-------|---------|
| Kode Soal | ya | |
| Level | ya | |
| Kode Audio | ya | Dari tab 003 |
| Urutan dalam Audio | tidak | |
| Pertanyaan | ya | |
| A–D + Jawaban Benar | ya | |
| Gambar Stimulus | jika Gambar | File di `images/` |
| Tipe Jawaban | ya | `Teks` / `Gambar` |

**Contoh bergambar:** A=1 B=2 C=3 D=4, Jawaban Benar=B, Gambar Stimulus=`contoh-gambar.png`.

## Upsert / validation

Sama seperti sebelumnya: upsert by code, replace package items, soft-lock sesi aktif, transactional.

Primary UI: `/admin/tryout/paket/import`. Template: `GET /api/admin/tryout/bank-template`.
