# Dokumentasi Serah Terima — JepangKu LMS

Paket dokumentasi ini disusun untuk **serah terima proyek** (September 2026) kepada developer atau tim yang akan melanjutkan pengembangan JepangKu LMS.

---

## Fakta cepat

| Item | Nilai |
| :--- | :--- |
| **Produk** | Platform belajar bahasa Jepang (JLPT N5–N1) |
| **Domain produksi** | `kursus.jepangku.com` |
| **Repo** | JepangKu LMS (bukan Core Backend, bukan Portal Berita) |
| **Fase** | 1 (MVP) — target akhir Juni 2026 |
| **Progres global** | **89%** (79 item terlacak) |
| **Branch aktif (contoh)** | `dev/<nama>` — merge ke `staging` / `main` untuk deploy |
| **Terakhir diperbarui tracker** | 2026-08-26 ([PROGRESS.md](../PROGRESS.md)) |

---

## Mulai di sini — urutan baca

| # | Dokumen | Isi |
| :-: | :--- | :--- |
| 1 | [01-project-overview.md](./01-project-overview.md) | Visi produk, scope repo, peran user, area fitur utama |
| 2 | [02-tech-stack.md](./02-tech-stack.md) | Runtime, framework, dependensi, skrip `bun` |
| 3 | [03-architecture.md](./03-architecture.md) | Pola feature-based, domain `features/`, alur data |
| 4 | [04-implementation-status.md](./04-implementation-status.md) | Progres MVP: selesai, sebagian, belum |
| 5 | [05-core-integration.md](./05-core-integration.md) | Integrasi LMS ↔ JepangKu Core (auth, JWT, XP) |
| 6 | [06-database-and-models.md](./06-database-and-models.md) | PostgreSQL LMS, model Prisma, User jangkar |
| 7 | [07-operations-runbook.md](./07-operations-runbook.md) | Setup lokal, env, testing, webhook, deploy |
| 8 | [08-gaps-backlog-and-risks.md](./08-gaps-backlog-and-risks.md) | Backlog Fase 2, risiko, rekomendasi tim penerima |
| 9 | [09-deploy-and-infra.md](./09-deploy-and-infra.md) | CI/CD, VPS staging/prod, GitHub secrets, rollback |

### Panduan pengguna (non-developer)

| Dokumen | Isi |
| :--- | :--- |
| [guide/README.md](./guide/README.md) | **Buku panduan operasional** — siswa & admin/sensei (Bahasa Indonesia) |
| [guide/JepangKu-LMS-Panduan-Lengkap.pdf](./guide/JepangKu-LMS-Panduan-Lengkap.pdf) | **PDF panduan lengkap** — untuk sensei/staf (buka langsung di browser/PDF reader) |

---

## Kontak tim ekosistem

| Layanan | Tim | Scope |
| :--- | :--- | :--- |
| **LMS** (repo ini) | Tim LMS | Kursus, lesson, kuis, progress, tryout, live class |
| **Core Backend** | Tim Core Backend | Clerk SSO, profil global, XP/level/badge, JWT |
| **Portal Berita** | Tim Portal Berita | Artikel, komentar (repo terpisah) |

Detail batas tanggung jawab: [ECOSYSTEM.md](../ECOSYSTEM.md).

---

## Peta ke dokumentasi existing

Dokumen handover ini **merangkum** — untuk detail lengkap, gunakan sumber kanonik:

| Topik | Dokumen kanonik |
| :--- | :--- |
| Status implementasi (living tracker) | [PROGRESS.md](../PROGRESS.md) |
| URL routing | [sitemap.md](../../sitemap.md) |
| Arsitektur teknis LMS | [ARCHITECTURE.md](../ARCHITECTURE.md) |
| Batas ekosistem | [ECOSYSTEM.md](../ECOSYSTEM.md) |
| Integrasi Core (status & blocker) | [CORE_INTEGRATION_STATUS.md](../CORE_INTEGRATION_STATUS.md) |
| Model pembayaran | [PAYMENT_MODEL.md](../PAYMENT_MODEL.md) |
| Database LMS | [DATABASE.md](../DATABASE.md) |
| Partner API | [PARTNER_API.md](../PARTNER_API.md) |
| UI/UX | [DESIGN.md](../../DESIGN.md) |
| Aturan coding Agent | [AGENTS.md](../../AGENTS.md) |
| Schema Core (canonical) | [jepangku-core/docs/](../../jepangku-core/docs/) |
| Runbook lintas-repo | [jepangku-core/docs/PHASE0-PHASE1.md](../../jepangku-core/docs/PHASE0-PHASE1.md) |
| Testing | [TESTING.md](../TESTING.md) |
| UAT | [UAT_CHECKLIST.md](../UAT_CHECKLIST.md) |

---

## Catatan untuk tim penerima

1. **Sumber kebenaran progres:** selalu [PROGRESS.md](../PROGRESS.md), bukan checklist lama di `CORE_INTEGRATION_STATUS.md` §6 (sudah usang).
2. **User di Prisma LMS** hanya jangkar FK — profil/XP dari Core JWT, bukan query `prisma.user` untuk nama/email.
3. **Prod belum final:** host DB production, verifikasi Core JWT prod, dan beberapa fitur masih 🟡 — lihat [08-gaps-backlog-and-risks.md](./08-gaps-backlog-and-risks.md).
