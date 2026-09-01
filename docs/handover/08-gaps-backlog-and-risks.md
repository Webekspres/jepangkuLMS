# 08 — Gaps, Backlog & Risiko

Dokumen ini merangkum apa yang **belum selesai**, **risiko produksi**, dan **rekomendasi** untuk developer yang melanjutkan proyek.

---

## Prioritas sebelum production

| # | Item | Status | Owner | Eskalasi |
| :-: | :--- | :--- | :--- | :--- |
| 1 | Verifikasi Core JWT exchange di staging/prod | ⏳ | LMS + Core | **Tim Core Backend** (deploy + JWT key) |
| 2 | Pilih & provision host PostgreSQL production | ⏳ | DevOps | **DevOps** — DB sudah di VPS Docker per deploy.yml |
| 3 | Lengkapi env secrets production (Clerk, Midtrans, R2, Resend, Sentry) | ⏳ | DevOps | **DevOps** — lihat `.env.example` |
| 4 | Selesaikan asset tes penempatan (Choukai audio/gambar) | 🟡 | Konten | **Tim produk / sensei lead** |
| 5 | Wire News → Partner API | ⬜ | LMS + News | **Tim Portal Berita** (consumer) + tim LMS (API key) |
| 6 | UAT end-to-end | ⏳ | QA | **QA / tim dev LMS** — [UAT_CHECKLIST.md](../UAT_CHECKLIST.md) |

---

## Matriks eskalasi cepat

| Topik | Hubungi | Tim yang menangani |
| :--- | :--- | :--- |
| Deploy gagal, VPS, disk, GitHub Actions | **DevOps / Webekspres** | SSH, secrets, docker compose |
| Core JWT 500, Clerk SSO global, role Core | **Tim Core Backend** | Fix di Core backend |
| Partner API / katalog di Portal Berita | **Tim Portal Berita** | Wiring di repo News |
| Cara tambah kursus/pelajaran/impor | **PDF panduan** + sensei lead | Operasional CMS harian |
| Pembayaran Midtrans dashboard | **DevOps / Finance** | Settlement di dashboard Midtrans |
| Bug kode LMS baru | **Tim dev LMS** | Bug fix & feature |
| Grant role admin sensei | **Admin LMS existing** | `/admin/users` → Admin |
| Tes penempatan / konten stub | **Tim produk** | Keputusan prioritas konten |
| Website down production | **DevOps** | Incident response |

---

## Item sebagian selesai (technical debt)

| Area | Masalah | File / lokasi | Eskalasi |
| :--- | :--- | :--- | :--- |
| **Core prod** | JWT exchange belum diverifikasi penuh di prod | `app/api/auth/core-token/`, `lib/core/` | **Tim Core Backend** |
| **Tes penempatan** | Choukai stub; asset sensei belum final | `features/placement/` | **Tim produk / konten** |
| **Kana** | Stroke GIF mistval pada beberapa huruf | `features/kana/` | **Tim dev LMS** (low priority) |
| **Landing** | Stat marketing statis | `features/marketing/` | **Tim produk** |
| **Video security** | YouTube embed — bukan DRM | `features/learning/` | **Tim dev LMS** — accepted risk |
| **Rate limiting** | Dihapus dari `proxy.ts` | `lib/rate-limit/` | **DevOps** + dev saat Redis siap |
| **Quiz engine** | Inline di lesson | `features/quiz-engine/` | **Tim dev LMS** |
| **Shadcn** | Komponen belum lengkap | `components/ui/` | **Tim dev LMS** on-demand |

---

## Belum diimplementasi

| Item | Detail | Dokumen |
| :--- | :--- | :--- |
| **News Partner API wiring** | Endpoint LMS sudah ada; Portal Berita belum consume | [PARTNER_API.md](../PARTNER_API.md) |

Untuk mengaktifkan Partner API:

1. Generate key: `openssl rand -hex 32`
2. Set `LMS_PARTNER_API_KEY` di env LMS production
3. Berikan key ke tim News untuk consume `GET /api/v1/partner/courses` dan `/live-classes`

---

## Backlog Fase 2 (🔮)

Sengaja di luar scope Fase 1 MVP:

- Status admin enrollment lebih kaya + `EnrollmentLog` on Midtrans auto-settle
- Integrasi News Partner API v1 (konsumsi dari sisi News)
- Tryout semua level N4–N1 + sesi Fase 2–4 penuh
- Leaderboard global dari Core API (bukan hanya poin LMS lokal)
- Membership / bundle / voucher — lihat [PAYMENT_MODEL.md](../PAYMENT_MODEL.md)
- Draft poin platform: [DRAFT_LMS_PLATFORM_POINTS.md](../DRAFT_LMS_PLATFORM_POINTS.md)

---

## Risiko & mitigasi

| Risiko | Dampak | Mitigasi | Eskalasi |
| :--- | :--- | :--- | :--- |
| Core down saat login | XP/profil tidak tampil akurat | Clerk-first gate; outbox XP retry | **Tim Core Backend** |
| Core token 500 di prod | Gamifikasi tidak sync | Deploy Core + public key sync | **Tim Core Backend** |
| Midtrans webhook gagal | Enrollment stuck PENDING | SSE + Cek status + admin grant | **DevOps** + admin LMS |
| DB prod issue | App error | Backup & migrate via migrator image | **DevOps** |
| `NEXT_PUBLIC_*` salah di build | URL redirect salah | Rebuild image | **DevOps** + dev |
| YouTube video leak | URL langsung | Enrollment gate | Accepted — **tim dev LMS** jika fix |
| Shared Clerk app | Config affect News+LMS | Koordinasi perubahan | **Tim Core Backend** |

---

## Keamanan

Audit ringkas: [SECURITY_AUDIT.md](../SECURITY_AUDIT.md)

Poin penting:

- Admin gate: `proxy.ts` + `canAccessLmsAdminPanel()`
- Open redirect: `sanitizeInternalRedirectPath` untuk post-login redirect
- Webhook: Svix (Clerk), Midtrans signature verification
- Service token: `JEPANGKU_CORE_SERVICE_TOKEN`, `LMS_CRON_SECRET` — jangan commit
- Partner API: key di env saja

---

## Rekomendasi untuk tim penerima

### Dokumentasi

1. **Perbarui [PROGRESS.md](../PROGRESS.md)** setiap selesai fitur MVP — ikuti aturan di [AGENTS.md](../../AGENTS.md)
2. **Jangan andalkan** checklist §6 di `CORE_INTEGRATION_STATUS.md` — sudah usang
3. **Sitemap SSOT:** ubah [sitemap.md](../../sitemap.md) dulu sebelum route baru

### Development

1. Jalankan **tiga app** (Core + LMS + News) saat uji integrasi auth/XP
2. Gunakan `bun run verify:core-gamification` setelah ubah flow XP
3. Tabel admin baru wajib pakai `useAdminTablePagination` + `AdminTablePagination`
4. UI baru: baca [DESIGN.md](../../DESIGN.md) — token semantic, bukan hex hardcoded

### Knowledge graph

Repo punya graphify di `graphify-out/` (gitignored):

```bash
graphify query "bagaimana alur enrollment?"
graphify update .   # setelah refactor struktural besar
```

### Kontak tim ekosistem

| Layanan | Tim | Scope |
| :--- | :--- | :--- |
| **LMS** (repo ini) | Tim LMS | Kursus, lesson, kuis, progress, tryout, live class |
| **Core Backend** | Tim Core Backend | Clerk SSO, profil global, XP/level/badge, JWT |
| **Portal Berita** | Tim Portal Berita | Artikel, komentar (repo terpisah) |

---

## Checklist serah terima (untuk tim penerima)

- [ ] Bisa jalankan `bun dev` + `db:seed` lokal tanpa error
- [ ] Bisa login Clerk + lihat dashboard siswa
- [ ] Core JWT cookie ter-set (dev dengan Core :8080)
- [ ] Paham batas LMS vs Core ([ECOSYSTEM.md](../ECOSYSTEM.md))
- [ ] Paham status 89% dan item 🟡 di [04-implementation-status.md](./04-implementation-status.md)
- [ ] Punya akses Clerk dashboard, Midtrans sandbox, R2 bucket (minta ke tim)
- [ ] Tahu cara run `bun test` dan `bun run test:e2e`
- [ ] Tahu siapa kontak untuk Core prod blocker
