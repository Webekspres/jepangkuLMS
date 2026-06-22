# Admin Bank Soal — Keputusan Arsitektur

| Meta | Nilai |
| :--- | :--- |
| **Status** | ✅ Keputusan final MVP |
| **Terakhir diperbarui** | 2026-06-19 |

## Ringkasan

Route sitemap `/admin/quiz` dan `/admin/quiz/import` **tidak** mengimplementasikan CMS bank soal terpusat dan **dihapus dari sidebar admin** (Juni 2026).

| Jenis soal | Lokasi CMS |
| :--- | :--- |
| **Kuis per pelajaran** | `/admin/kursus → modul → pelajaran → tab Bank Soal` (lesson workspace) |
| **Tryout JLPT** | `/admin/tryout → [sesi] → Soal` — filter level N5–N1 + bagian MOJI_GOI / BUNPOU_DOKKAI / CHOKAI |

## Alasan

1. Soal kuis di schema Prisma terikat `lessonId` — natural fit dengan konten pembelajaran.
2. Soal tryout terikat `tryoutSessionId` + `tryoutLevel` — dikelola per sesi simulasi.
3. Menghindari duplikasi UI dan menu "Bank Soal" global yang membingungkan.

## Route `/admin/quiz` (legacy)

Halaman informasi + redirect ke Kelola Kursus — **tidak** muncul di sidebar.

## Import CSV

Soal kuis lesson dapat diimpor lewat `/admin/kursus/import` (kolom `quiz_*`).
