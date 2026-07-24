# Admin Executive Dashboard Refactor

Living implementation plan untuk refactor `/admin/dashboard` menjadi executive LMS dashboard.

**Status:** implemented (Phase 1–5)  
**Chart library:** [Recharts](https://recharts.org) (`recharts` di `package.json`)  
**Constraint:** hanya widget dari data Prisma yang ada; tanpa Revenue/Rating dummy

---

## Keputusan chart

Pakai **Recharts** agar development lebih cepat (Area / Line / Bar / Pie / Radial siap pakai).

- Dashboard admin: wrapper Recharts bertema token JepangKu (`primary`, `muted-foreground`, …) — tanpa hex hardcoded
- [`components/charts/simple-bar-chart.tsx`](../components/charts/simple-bar-chart.tsx) + `WeeklyXpChart` siswa **tetap** untuk sekarang (tidak wajib migrasi)

### Wrapper teknis

```text
features/admin-cms/components/dashboard/charts/
  chart-theme.ts
  chart-tooltip.tsx
  enrollment-trend-chart.tsx   # AreaChart
  student-growth-chart.tsx     # LineChart
  top-courses-chart.tsx        # BarChart
  enrollment-mix-chart.tsx     # PieChart / Donut
  tryout-performance-chart.tsx # BarChart
  live-fill-chart.tsx          # RadialBarChart
```

Chart leaf = `'use client'`. Agregasi data di RSC loader.

---

## 1. Audit Dashboard Saat Ini

### Kelebihan

- Thin RSC + feature component
- Loader `cache()` + `Promise.all`
- Sudah ada chart enrollment 7 hari (custom bar)
- Quick actions ke `ADMIN_ROUTES`
- Panel GA4/GSC berguna untuk ops integrasi

### Kekurangan

- KPI flat tanpa delta / drill-down
- `studentCount` = semua `User` (termasuk admin)
- Kartu Tryout mencampur sesi aktif + attempt kuis
- Ringkasan Program mengulang KPI
- Tidak ada activity feed (`EnrollmentLog` sudah ada)
- Tidak memanfaatkan popularitas kursus, completion, tryout scores, badge, growth

### UX Issues

- Bukan executive cockpit
- Analytics & SEO memakan real estate utama (status env, bukan insight LMS)
- Pending payment tidak di-highlight sebagai attention item

### Missing Insights

- Student growth, top courses, completion, tryout performance, live fill, recent activity

---

## 2. Data Audit

### Sudah tersedia

| Domain | Source |
| :--- | :--- |
| Siswa | `User` (`role`, `createdAt`) — filter `LMS_STUDENT` |
| Enrollment | `Enrollment` (`status`, `type`, `createdAt`) |
| Activity | `EnrollmentLog` |
| Kursus | `Course` (published, level, category, `priceIdr` katalog) |
| Progress | `UserProgress` |
| Kuis / tryout | `QuizAttempt` (`QUIZ` \| `TRYOUT`, score, `tryoutLevel`) |
| Live class | `LiveClass` / `LiveClassSession` |
| Tryout sesi | `TryoutSession` |
| Badge | `UserBadge` |
| Placement | `PlacementAttempt` |
| Gamifikasi lokal | `LmsXpEvent` / `LmsPointEvent` (opsional) |

### Belum tersedia (jangan dipaksa)

- Payment ledger / true revenue / MRR
- Course rating / NPS
- `lastActiveAt` / session login
- Email broadcast metrics
- GA4 time-series di DB LMS

### Perlu implementasi tambahan (nanti)

- Estimasi GMV opsional (label jelas, bukan Revenue)
- `User.lastLearningAt` untuk active learner trend
- `/admin/settings` untuk integrasi GA4/GSC

---

## 3. Dashboard Layout Baru

```text
--------------------------------------------------
 Header + range (7h | 30h via searchParams)
--------------------------------------------------
 Attention: Pending > 0 → Verifikasi Pembayaran
--------------------------------------------------
 KPI grid (6–8)
--------------------------------------------------
 Enrollment Trend (Area) | Student Growth (Line)
--------------------------------------------------
 Top Courses (Bar)       | Enrollment Mix (Donut)
--------------------------------------------------
 Tryout by Level (Bar)   | Live Class Fill (Radial)
--------------------------------------------------
 Recent Activity         | Quick Actions
--------------------------------------------------
 Footer link: Integrasi Analytics (bukan panel penuh)
--------------------------------------------------
```

---

## 4. Widget Specification

| Widget | Source | Chart / UI | Effort |
| :--- | :--- | :--- | :--- |
| Total Siswa | `User` role student + delta | KPI card | S |
| Enrollment aktif / pending / total | `Enrollment` | KPI | S |
| Kursus published | `Course` | KPI | S |
| Tryout / Quiz attempts (periode) | `QuizAttempt` type split | KPI | S |
| Badge issued | `UserBadge` | KPI | S |
| Completion proxy | `UserProgress` | KPI / Radial | M |
| Enrollment Trend | `Enrollment.createdAt` | Recharts AreaChart | M |
| Student Growth | `User.createdAt` | Recharts LineChart | M |
| Top Courses | enrollment `groupBy` course | Recharts BarChart | M |
| Enrollment Mix | `groupBy` type | Recharts PieChart | S |
| Tryout Performance | TRYOUT by level | Recharts BarChart | M |
| Live Fill | `filledSlots` / `maxSlots` | RadialBarChart | S |
| Recent Activity | `EnrollmentLog` take 10–15 | List | S |
| Quick Actions | routes (+ Import Kursus, Paket) | Buttons | S |
| Revenue / Rating | — | **Tidak** | — |

---

## 5. Chart Recommendation (Recharts)

| Widget | Component | Mengapa |
| :--- | :--- | :--- |
| Enrollment Trend | `AreaChart` + `Area` | Tren volume; area menekankan momentum |
| Student Growth | `LineChart` + `Line` | Slope akuisisi jelas |
| Top Courses | `BarChart` + `Bar` (vertical layout) | Ranking judul panjang |
| Enrollment Mix | `PieChart` donut (`innerRadius`) | Proporsi 3 tipe |
| Tryout by Level | `BarChart` | Kategori diskrit N5–N1 |
| Live Fill | `RadialBarChart` | Utilisasi 0–100% |
| Completion KPI | Radial kecil atau progress non-chart | Single ratio |

Theme: `chart-theme.ts` map ke semantic CSS tokens.

---

## 6. Technical Plan

### Dependency

- `bun add recharts`
- Tidak ubah Prisma untuk Phase 1–4

### Loader

- Perluas [`load-admin-dashboard-stats.ts`](../features/admin-cms/lib/load-admin-dashboard-stats.ts) → `loadAdminDashboardInsights({ rangeDays: 7 | 30 })`
- Satu DTO agregat; hindari N+1; reuse enrollment counts / EnrollmentLog loaders

### UI

- Pecah [`admin-dashboard-page.tsx`](../features/admin-cms/components/admin-dashboard-page.tsx) ke `features/admin-cms/components/dashboard/*`
- Route [`page.tsx`](../app/(admin)/admin/dashboard/page.tsx): `searchParams.range`
- Chart = client Recharts; shell = RSC

### Analytics & SEO

- Keluar dari body utama → footer link atau `/admin/settings` (Phase 5)
- Alasan: status env ≠ executive insight

### Caching

- Tetap `React.cache`; Phase 5 pertimbangkan tag / `revalidatePath` setelah approve enrollment

---

## 7. Refactor Roadmap

### Phase 1 — KPI & correctness

- Goal: filter siswa, pecah quiz/tryout, layout section siap chart
- Files: loader, `admin-dashboard-page`, `admin-stat-card`
- Risiko: rendah · Effort: ~1 hari

### Phase 2 — Recharts + tren inti

- Goal: install Recharts, theme wrapper, Enrollment Area, Student Growth Line, Top Courses Bar, Mix Donut
- Files: `package.json`, `dashboard/charts/*`, loader buckets 7/30
- Risiko: sedang (bundle + token styling) · Effort: ~2 hari

### Phase 3 — Learning & tryout

- Goal: completion proxy, tryout bars, live radial, placement mix
- Risiko: completion query bisa mahal → mulai volume completions lalu rate
- Effort: ~2–3 hari

### Phase 4 — Activity & actions

- Goal: EnrollmentLog feed, attention banner, quick actions (Import Kursus, Paket Tryout)
- Effort: ~1 hari

### Phase 5 — Polish

- Goal: pindah GA panel, empty states, update `PROGRESS.md`
- Effort: ~1 hari

**Non-goals:** Revenue chart, rating, GA embedded reports, migrasi wajib `WeeklyXpChart` ke Recharts.

---

## Verifikasi

- KPI match Prisma spot-check
- Range 7/30 mengubah data chart
- Recharts responsive di mobile
- Tidak ada widget Revenue/Rating
- `tsc` + lint hijau

---

## File terkait saat ini

| Path | Peran |
| :--- | :--- |
| [`app/(admin)/admin/dashboard/page.tsx`](../app/(admin)/admin/dashboard/page.tsx) | RSC route |
| [`features/admin-cms/components/admin-dashboard-page.tsx`](../features/admin-cms/components/admin-dashboard-page.tsx) | UI sekarang |
| [`features/admin-cms/lib/load-admin-dashboard-stats.ts`](../features/admin-cms/lib/load-admin-dashboard-stats.ts) | KPI loader |
| [`features/admin-cms/components/admin-analytics-panel.tsx`](../features/admin-cms/components/admin-analytics-panel.tsx) | GA4/GSC panel |
| [`components/charts/simple-bar-chart.tsx`](../components/charts/simple-bar-chart.tsx) | Chart lama (siswa / admin sekarang) |
