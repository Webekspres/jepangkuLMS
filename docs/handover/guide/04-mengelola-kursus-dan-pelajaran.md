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
