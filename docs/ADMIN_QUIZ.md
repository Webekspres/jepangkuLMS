# Admin Bank Soal — Keputusan Arsitektur

| Meta | Nilai |
| :--- | :--- |
| **Status** | ✅ Keputusan final MVP |
| **Terakhir diperbarui** | 2026-06-18 |

## Ringkasan

Route sitemap `/admin/quiz` dan `/admin/quiz/import` **tidak** mengimplementasikan CMS bank soal terpusat.

Soal kuis dikelola **per pelajaran (lesson)** di dalam lesson workspace admin:

```text
/admin/kursus → [course] → modul → pelajaran → tab Bank Soal
```

## Alasan

1. Soal di schema Prisma terikat `lessonId` — natural fit dengan konten pembelajaran.
2. Admin sudah bisa CRUD soal + opsi jawaban di lesson workspace.
3. Menghindari duplikasi UI dan sinkronisasi soal global vs soal lesson.

## Route `/admin/quiz`

Menampilkan halaman informasi + link ke Kelola Kursus.

## Tryout JLPT

Soal tryout (`Question.type = TRYOUT`, `lessonId = null`) dikelola via seed / migrasi data, bukan CMS admin Fase 1.
