# Partner API — Katalog Publik (Read-Only)

Dokumen ini menjelaskan **API server-to-server** agar partner (mis. Portal Berita, landing eksternal, linktree custom, atau sistem tim lain) bisa mengambil data **kursus** dan **live class** yang sudah dipublikasikan dari LMS tanpa login Clerk.

| Meta | Nilai |
| :--- | :--- |
| **Status kode** | ✅ **Sudah diimplementasi** (kursus + live class) |
| **Status API key** | ⬜ **Belum otomatis ada** — harus dibuat & diset di env |
| **Terakhir diperbarui** | 2026-08-07 |
| **Base URL (prod)** | `https://kursus.jepangku.com` |
| **Base URL (dev)** | `NEXT_PUBLIC_APP_URL` di `.env` lokal (mis. `http://localhost:3000`) |

---

## 1. Apakah API key sudah ada?

| Pertanyaan | Jawaban |
| :--- | :--- |
| Apakah endpoint API sudah dibuat? | **Ya** — lihat §3. |
| Apakah sudah ada API key bawaan di repo? | **Tidak.** Tidak ada secret yang di-commit. |
| Apakah production sudah punya key? | **Hanya jika** tim DevOps sudah set `LMS_PARTNER_API_KEY` di env VPS. Cek dengan §5 (tanpa key → HTTP `503`). |
| Apakah dev lokal sudah aktif? | **Hanya jika** kamu menambah `LMS_PARTNER_API_KEY=...` ke `.env` lokal lalu restart `bun dev`. |

**Kesimpulan:** Fitur API **sudah ada di kode**, tapi partner **belum bisa memakai** sampai seseorang (Kris / DevOps) **generate key** dan menaruhnya di environment server.

---

## 2. Cara mengaktifkan (tim LMS / DevOps)

### 2.1 Generate key

Gunakan string acak panjang (min. 32 byte hex disarankan):

```bash
openssl rand -hex 32
```

Contoh output: `a1b2c3d4e5f6...` (simpan di password manager — **jangan** commit ke git).

### 2.2 Set environment variable

**Lokal** — tambahkan ke `.env` (salin dari `.env.example`):

```bash
LMS_PARTNER_API_KEY=a1b2c3d4e5f6...
```

Restart dev server: `bun dev`.

**Production (VPS)** — tambahkan ke `.env.lms` atau blok `environment:` di Docker Compose, lalu redeploy service LMS.

| Variable | Wajib | Keterangan |
| :--- | :---: | :--- |
| `LMS_PARTNER_API_KEY` | Ya (untuk mengaktifkan API) | Secret shared dengan partner. Kosong = API **nonaktif** (HTTP `503`). |
| `NEXT_PUBLIC_APP_URL` | Disarankan | Dipakai untuk field `url` di response. |

### 2.3 Bagikan key ke partner

- Kirim lewat channel aman (1Password, DM terenkripsi, dll.).
- Partner memanggil API **dari backend mereka**, bukan dari browser (agar key tidak bocor).
- Jika key bocor: generate key baru, update env, redeploy, beri tahu partner.

---

## 3. Endpoint

Semua endpoint di bawah membutuhkan API key (§4). Hanya resource dengan `isPublished: true` yang dikembalikan.

### 3.1 Kursus

| Method | Path | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/public/courses` | Daftar semua kursus publikasi |
| `GET` | `/api/v1/public/courses/[slug]` | Detail satu kursus + silabus (modul & pelajaran) |

**Implementasi kode:**

- `app/api/v1/public/courses/route.ts`
- `app/api/v1/public/courses/[slug]/route.ts`
- Query: `features/public-api/lib/load-public-courses.ts`

### 3.2 Live class

| Method | Path | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/public/live-classes` | Daftar semua live class publikasi |
| `GET` | `/api/v1/public/live-classes/[id]` | Detail satu live class + jadwal sesi |

**Implementasi kode:**

- `app/api/v1/public/live-classes/route.ts`
- `app/api/v1/public/live-classes/[id]/route.ts`
- Query: `features/public-api/lib/load-public-live-classes.ts`

**Shared:** Auth `lib/api/partner-auth.ts`, response `lib/api/partner-response.ts`.

---

## 4. Autentikasi

Kirim key dengan **salah satu** header berikut:

```http
Authorization: Bearer <LMS_PARTNER_API_KEY>
```

atau

```http
X-LMS-API-Key: <LMS_PARTNER_API_KEY>
```

### Contoh — daftar kursus

```bash
curl -s \
  -H "Authorization: Bearer $LMS_PARTNER_API_KEY" \
  "https://kursus.jepangku.com/api/v1/public/courses"
```

### Contoh — detail kursus

```bash
curl -s \
  -H "Authorization: Bearer $LMS_PARTNER_API_KEY" \
  "https://kursus.jepangku.com/api/v1/public/courses/jlpt-n5-demo"
```

### Contoh — daftar live class

```bash
curl -s \
  -H "Authorization: Bearer $LMS_PARTNER_API_KEY" \
  "https://kursus.jepangku.com/api/v1/public/live-classes"
```

### Contoh — detail live class

```bash
curl -s \
  -H "Authorization: Bearer $LMS_PARTNER_API_KEY" \
  "https://kursus.jepangku.com/api/v1/public/live-classes/<uuid>"
```

### Dev lokal

```bash
curl -s \
  -H "Authorization: Bearer $LMS_PARTNER_API_KEY" \
  "http://localhost:3000/api/v1/public/courses"

curl -s \
  -H "Authorization: Bearer $LMS_PARTNER_API_KEY" \
  "http://localhost:3000/api/v1/public/live-classes"
```

---

## 5. Response & error

### 5.1 Daftar kursus (`GET /api/v1/public/courses`)

```json
{
  "data": [
    {
      "slug": "jlpt-n5-demo",
      "title": "JLPT N5 Demo",
      "description": "Ringkasan kursus...",
      "level": "N5",
      "priceIdr": 0,
      "lessonCount": 12,
      "moduleCount": 3,
      "url": "https://kursus.jepangku.com/kursus/jlpt-n5-demo"
    }
  ],
  "meta": { "count": 1 }
}
```

### 5.2 Detail kursus (`GET /api/v1/public/courses/[slug]`)

Sama seperti item di `data[]`, ditambah:

```json
{
  "data": {
    "slug": "jlpt-n5-demo",
    "title": "...",
    "modules": [
      {
        "slug": "modul-1",
        "title": "Modul 1",
        "description": "...",
        "order": 1,
        "lessons": [
          {
            "slug": "pengenalan-aksara",
            "title": "Pengenalan Aksara",
            "order": 1,
            "hasQuiz": true
          }
        ]
      }
    ]
  }
}
```

### 5.3 Daftar live class (`GET /api/v1/public/live-classes`)

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Speaking Club N5",
      "description": "Latihan percakapan mingguan...",
      "senseiName": "Sensei Aya",
      "senseiLevel": "N1",
      "category": "Speaking",
      "level": "N5",
      "priceIdr": 150000,
      "maxSlots": 30,
      "filledSlots": 12,
      "slotsRemaining": 18,
      "isFull": false,
      "isEnrollmentClosed": false,
      "coverImageUrl": "https://cdn.example.com/live-class-cover.webp",
      "sessionCount": 4,
      "nextSessionAt": "2026-08-10T10:00:00.000Z",
      "url": "https://kursus.jepangku.com/dashboard/live-class/a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    }
  ],
  "meta": { "count": 1 }
}
```

Field `url` mengarah ke halaman detail di dashboard LMS (perlu login). Cocok sebagai CTA linktree → siswa login lalu daftar.

### 5.4 Detail live class (`GET /api/v1/public/live-classes/[id]`)

Sama seperti item di `data[]`, ditambah jadwal sesi (tanpa Zoom / recording):

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "title": "Speaking Club N5",
    "sessions": [
      {
        "id": "sess-uuid-1",
        "title": "Pertemuan 1",
        "scheduledAt": "2026-08-10T10:00:00.000Z",
        "endsAt": "2026-08-10T11:00:00.000Z"
      }
    ]
  }
}
```

### 5.5 Kode HTTP

| Status | `code` | Arti |
| :---: | :--- | :--- |
| `200` | — | Sukses |
| `401` | `UNAUTHORIZED` | Key hilang atau salah |
| `404` | `NOT_FOUND` | Slug/id tidak ada atau resource belum dipublikasikan |
| `503` | `PARTNER_API_DISABLED` | `LMS_PARTNER_API_KEY` belum diset di server |

Response sukses memakai header cache: `Cache-Control: public, max-age=60, s-maxage=300`.

---

## 6. Data yang dikeluarkan vs tidak

### Kursus

| ✅ Dikeluarkan | ❌ Tidak dikeluarkan |
| :--- | :--- |
| Metadata kursus (judul, slug, level, harga, deskripsi) | Kursus draft / `isPublished: false` |
| Jumlah modul & pelajaran | UUID internal database |
| Struktur silabus (modul → pelajaran) | Konten pelajaran, URL video |
| Flag `hasQuiz` per pelajaran | Soal kuis, jawaban, flashcard |
| Link publik `url` ke halaman marketing | Data user, enrollment, pembayaran |

### Live class

| ✅ Dikeluarkan | ❌ Tidak dikeluarkan |
| :--- | :--- |
| Metadata (judul, sensei, level, kategori, harga, cover) | Live class draft / `isPublished: false` |
| Kapasitas (`maxSlots`, `filledSlots`, `slotsRemaining`, `isFull`) | `meetingUrl` (Zoom) |
| Jadwal sesi (`title`, `scheduledAt`, `endsAt`) | `recordingUrl` |
| `isEnrollmentClosed`, `nextSessionAt` | `paymentLink` |
| `url` ke `/dashboard/live-class/[id]` | Enrollment, pembayaran, data siswa |

Ini **bukan** API belajar siswa — partner hanya mendapat **katalog + outline / jadwal** untuk ditampilkan atau di-link ke LMS.

---

## 7. Checklist untuk partner

1. Minta `LMS_PARTNER_API_KEY` ke tim JepangKu LMS (setelah diaktifkan di server).
2. Panggil API dari **server backend** partner (bukan frontend publik).
3. Gunakan field `url` untuk deep link ke LMS (kursus = marketing page; live class = dashboard detail + login).
4. Untuk linktree live class: fetch `GET /api/v1/public/live-classes`, render kartu, CTA ke `url`.
5. Tangani `401` / `503` — jangan retry tanpa batas jika key salah.
6. Cache response di sisi partner (opsional) — LMS sudah mengirim `Cache-Control` singkat.

---

## 8. Verifikasi cepat (tim LMS)

```bash
# Tanpa key → harus 503 (API disabled) atau 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/public/courses
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/public/live-classes

# Dengan key di .env + restart dev → harus 200
curl -s -H "Authorization: Bearer $(grep LMS_PARTNER_API_KEY .env | cut -d= -f2)" \
  http://localhost:3000/api/v1/public/courses | head -c 200

curl -s -H "Authorization: Bearer $(grep LMS_PARTNER_API_KEY .env | cut -d= -f2)" \
  http://localhost:3000/api/v1/public/live-classes | head -c 200
```

Unit test auth: `bun test tests/unit/partner-api-auth.test.ts`

---

## 9. Roadmap (belum ada)

| Fitur | Status |
| :--- | :---: |
| Rate limiting per key | ⬜ |
| Key terpisah per partner | ⬜ |
| CORS untuk domain partner tertentu | ⬜ |
| Webhook saat kursus / live class dipublikasikan | ⬜ |

---

## 10. Dokumen terkait

- [.env.example](../.env.example) — placeholder `LMS_PARTNER_API_KEY`
- [sitemap.md](../sitemap.md) — URL publik `/kursus`, `/kursus/[courseSlug]`, `/dashboard/live-class`
- [ECOSYSTEM.md](./ECOSYSTEM.md) — batas data LMS vs Core vs News
