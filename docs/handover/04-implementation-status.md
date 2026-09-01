# 04 — Status Implementasi

Snapshot per **September 2026**, disarikan dari [PROGRESS.md](../PROGRESS.md) (terakhir diperbarui 2026-08-26).

**Sumber kebenaran:** [PROGRESS.md](../PROGRESS.md) — perbarui dokumen itu saat ada kemajuan MVP, bukan file handover ini.

---

## Progres global Fase 1

```text
[██████████████████░░] 89%
```

| Meta | Nilai |
| :--- | :--- |
| Total item terlacak | 79 |
| ✅ Selesai | 65 |
| 🟡 Sebagian | 13 |
| ⬜ Belum | 1 |
| Target MVP | Akhir Juni 2026 |

**Rumus:** `((✅ × 1) + (🟡 × 0,4) + (⬜ × 0)) ÷ 79 × 100` ≈ **89%**

### Per area

| Area | Bobot | ✅ | 🟡 | ⬜ | % area |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Infrastruktur & platform | 17 | 13 | 4 | 0 | 86% |
| Halaman & routing | 38 | 32 | 6 | 0 | 91% |
| Domain `features/` | 9 | 7 | 2 | 0 | 87% |
| Data & integrasi | 8 | 7 | 0 | 1 | 87% |
| Keamanan & bisnis | 7 | 6 | 1 | 0 | 91% |

---

## Legenda status

| Simbol | Arti |
| :----: | :--- |
| ✅ | Selesai — perilaku sesuai spesifikasi MVP |
| 🟡 | Sebagian — ada tapi belum lengkap / mock parsial |
| ⬜ | Belum — tidak ada implementasi bermakna |
| 🔮 | Fase 2 — sengaja di luar scope Fase 1 |

---

## Yang sudah selesai (highlight ✅)

### Infrastruktur

- Next.js 16 App Router + React 19, Tailwind v4, Bun
- Prisma schema PostgreSQL LMS + singleton `lib/prisma.ts`
- Clerk auth + `proxy.ts` admin gate
- Partner API v1, Sentry errors + tracing
- Seed N5 + tryout + live class + 8 badge starter

### Alur siswa end-to-end

- Katalog kursus (`/dashboard/kursus`) + kursus terdaftar (`/dashboard/kursus-saya`)
- Enrollment + checkout Midtrans (Snap + Core API)
- Workspace belajar: video, materi, kuis inline, Q&A nested
- Progress tracking + award XP ke Core
- Leaderboard, profil, achievements, badge equip sebagai title

### Tryout JLPT

- Paket soal (`JlptQuestionSet`) + sesi tryout
- Ujian per blok level (N5–N3 tiga bagian; N1/N2 gabung Vocab+Grammar)
- Choukai: audio master + continuous player
- Hasil: popup animasi, analisa per seksi, jalur JLPT di dashboard

### Admin CMS

- CRUD kursus/modul/lesson + lesson workspace (soal per pelajaran)
- Import kursus multi-template (official + sensei N4/N5)
- Import paket soal ZIP (tryout)
- Executive dashboard (Recharts, KPI, activity feed)
- Pembayaran: antrian + riwayat `EnrollmentLog`
- Badge CMS + grant manual + riwayat

### Lainnya

- Live class CRUD + enrollment + email reminder harian (cron)
- Payment SSE realtime + invoice PDF
- Course import integration test + rollback validasi
- Gamifikasi: `verify:core-gamification` script; flashcard/tryout/quiz wired ke Core XP

---

## Yang sebagian selesai (🟡)

| Item | Catatan | Prioritas tim penerima |
| :--- | :--- | :---: |
| Landing `/` | Hero lengkap; stat marketing masih statis | Rendah |
| `/tryout` publik | Halaman info; ujian interaktif di belakang login | Rendah |
| `/tes-penempatan` | Hub + UI ujian ada; asset sensei/Choukai masih stub | Sedang |
| `/dashboard/kana/*` | Chart + audio 104 huruf; stroke GIF ada mistval | Sedang |
| `lib/core/` prod JWT | Dev lokal OK; prod belum diverifikasi penuh | **Tinggi** |
| Secured video | API gate + player hardening; YouTube bukan DRM penuh | Sedang |
| Rate limiting | Dihapus dari `proxy.ts` (429 di staging); `lib/rate-limit/` tersimpan | Rendah |
| Quiz engine | Inline di lesson workspace; bukan focus-mode `/kuis/[slug]` terpisah | Rendah |
| Shadcn UI | Cukup untuk MVP; tambah komponen sesuai kebutuhan | Rendah |
| Zustand quiz store | Ada; kuis utama inline di lesson | Rendah |
| `.env` production | Lokal OK; prod env dengan DevOps | **Tinggi** |
| TanStack Query | Dipasang; penggunaan terbatas | Rendah |

---

## Yang belum diimplementasi (⬜)

| Item | Catatan |
| :--- | :--- |
| **News → Partner API wiring** | Endpoint Partner API sudah ada di kode; integrasi ke Portal Berita belum di-wire |

---

## Status routing (ringkas)

### Public & marketing

| Route | Status |
| :--- | :---: |
| `/` | 🟡 |
| `/kursus`, `/kursus/[slug]` | ✅ |
| `/live-class/[id]` | ✅ |
| `/tryout` | 🟡 |
| `/tryout/[sessionCode]` | ✅ |
| `/tes-penempatan` | 🟡 |
| `/tentang`, `/cara-belajar`, `/hubungi`, legal | ✅ |

### Student `/dashboard/*`

| Route | Status |
| :--- | :---: |
| `/dashboard` | ✅ |
| `/dashboard/kursus`, `/dashboard/kursus-saya` | ✅ |
| `/dashboard/belajar/...` | ✅ |
| `/dashboard/kuis/.../hasil` | ✅ |
| `/dashboard/leaderboard`, `/profil`, `/achievements` | ✅ |
| `/dashboard/live-class/*` | ✅ |
| `/dashboard/tryout/*` | ✅ |
| `/dashboard/tes-penempatan/*` | 🟡 |
| `/dashboard/checkout/*`, `/dashboard/pembayaran/*` | ✅ |
| `/dashboard/kana/hiragana`, `/katakana` | 🟡 |

### Admin `/admin/*`

| Route | Status |
| :--- | :---: |
| `/admin/dashboard` | ✅ |
| `/admin/settings` | ✅ |
| `/admin/live-class` | ✅ |
| `/admin/tryout/*` (paket, import, sesi) | ✅ |
| `/admin/pembayaran` | ✅ |
| `/admin/kursus/*` (CRUD, import, workspace) | ✅ |
| `/admin/quiz` (info page) | ✅ |
| `/admin/badges`, `/admin/badges/grant` | ✅ |

---

## Domain `features/` (ringkas)

| Domain | Status |
| :--- | :---: |
| learning | ✅ |
| admin-cms | ✅ |
| student | ✅ |
| tryout | ✅ |
| placement | 🟡 |
| live-class | ✅ |
| public-api | ✅ |
| gamification | ✅ |
| kana | 🟡 |
| quiz-engine | 🟡 |

---

## Backlog Fase 2 (🔮)

Sengaja di luar scope Fase 1 — dari [PROGRESS.md](../PROGRESS.md) §6:

- Status admin enrollment yang lebih kaya + `EnrollmentLog` on Midtrans auto-settle
- Integrasi News Partner API v1 (wire ke Portal Berita)
- Tryout semua level N4–N1 + sesi Fase 2–4 penuh
- Leaderboard global dari Core API (bukan hanya LMS poin)
- Membership / bundle / voucher — lihat [PAYMENT_MODEL.md](../PAYMENT_MODEL.md)

Detail risiko & rekomendasi: [08-gaps-backlog-and-risks.md](./08-gaps-backlog-and-risks.md).
