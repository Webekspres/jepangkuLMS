# LMS — Poin, Badge & Display Name (implementasi)

> **Status:** Implementasi awal · **2026-06-15**  
> Selaras Core API v2.1.0 — XP/level global di Core; poin, badge, leaderboard, display name di DB LMS.

---

## 1. Masalah

Leaderboard LMS saat ini memanggil Core `GET /api/v1/leaderboard`, yang mengurutkan berdasarkan **`totalXp` global** (XP dari seluruh ekosistem).

Akibatnya: user yang hanya aktif di Portal Berita (baca artikel, kuis ringan) bisa **ranking tinggi di leaderboard LMS** meskipun tidak pernah belajar di LMS.

| Konsep | Lokasi hari ini | Dipakai untuk |
| :--- | :--- | :--- |
| `totalXp` | Core (`users.total_xp`) | Level global + leaderboard LMS ❌ |
| `currentPoints` | Core (`users.current_points`) | Saldo poin spendable di UI LMS |
| Progress belajar | LMS DB (`UserProgress`, `QuizAttempt`) | Continue learning, quiz — **bukan** ranking |

---

## 2. Keputusan arsitektur (disepakati tim)

Pisahkan tiga konsep:

```text
Global XP + Level     → Core (identitas JepangKu lintas app)
Poin / score LMS      → DB LMS (leaderboard & reward LMS saja)
Poin / score Portal   → DB Portal Berita (leaderboard portal saja)
```

- Core **tetap** menyimpan user, `total_xp`, `level`, badge, JWT claims.
- Core **menghapus** tabel/kolom poin global (`current_points`, wallet spendable) — detail di repo Core.
- Leaderboard **per aplikasi** hanya dari poin/score lokal app tersebut.
- Award XP ke Core **tetap** dipanggil dari LMS (untuk level global); poin leaderboard **ditambah di LMS**.

---

## 3. Alur target (LMS)

```text
User menyelesaikan lesson / quiz
    │
    ├─► LMS DB: +lmsPoints (idempotent via sourceKey)
    │
    └─► Core API POST /api/v1/gamification/award
            xpGained only (tanpa pointsGained global)
            application: "lms"
            idempotencyKey: ...
```

Leaderboard LMS: query **DB LMS**, bukan `GET /api/v1/leaderboard` global.

UI profil/dashboard:

| Tampilan | Sumber |
| :--- | :--- |
| Level, total XP global | Core JWT / `GET /users/me` |
| Poin LMS, rank LMS | DB LMS |
| Badge | Core |

---

## 4. Draft model Prisma (LMS)

Belum ditambahkan ke `schema.prisma`. Dua opsi — **Opsi A** direkomendasikan untuk MVP leaderboard.

### Opsi A — Snapshot + ledger ringan (disarankan)

```prisma
/// Saldo poin LMS untuk leaderboard & (opsional) reward shop LMS.
model UserLmsStats {
  userId     String   @id
  lmsPoints  Int      @default(0)
  updatedAt  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

/// Audit trail + idempotency saat award dari server action / webhook.
model LmsPointEvent {
  id             String   @id @default(uuid())
  userId         String
  pointsGained   Int
  /// Kunci idempotensi, mis. "lesson:{lessonId}:complete" atau "quiz:{attemptId}"
  sourceKey      String   @unique
  sourceType     String   // LESSON_COMPLETE | QUIZ_PASS | TRYOUT | MANUAL
  sourceId       String?
  xpReportedToCore Boolean @default(false)
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt(sort: Desc)])
}
```

Perlu menambah relasi di model `User`:

```prisma
model User {
  // ... existing fields
  lmsStats      UserLmsStats?
  lmsPointEvents LmsPointEvent[]
}
```

### Opsi B — Derive dari progress (tanpa tabel baru)

Hitung ranking dari `UserProgress` + `QuizAttempt` + `Question.xpReward`. **Tidak disarankan** untuk leaderboard jangka panjang: query berat, sulit menyesuaikan bobot, dan tidak cocok untuk poin spendable LMS.

---

## 5. Aturan bisnis (draft)

| Event | `lmsPoints` (contoh) | `xpGained` ke Core |
| :--- | :--- | :--- |
| Lesson selesai | 10–20 | sama atau berbeda (product decision) |
| Quiz lulus | skor × bobot | dari `Question.xpReward` / skor |
| Tryout | skor × bobot lebih tinggi | idem |

- **`sourceKey` wajib unik** — mencegah double award saat retry server action.
- User yang belum punya baris `UserLmsStats` dianggap `lmsPoints = 0` (lazy create on first event).
- User Portal-only **tidak muncul** di leaderboard LMS kecuali pernah login LMS dan punya event.

---

## 6. Perubahan kode LMS (checklist nanti)

| Area | Perubahan |
| :--- | :--- |
| `prisma/schema.prisma` | Model §4 + migrate |
| `lib/core/gamification.ts` | Hentikan kirim `pointsGained` ke Core; tetap `xpGained` |
| `lib/core/api.ts` | Leaderboard LMS → query lokal; Core leaderboard opsional dihapus dari UI |
| `features/student/lib/load-student-core-data.ts` | Rank/poin dari LMS DB |
| `features/student/components/*` | Label "Poin LMS"; rank dari LMS |
| `features/learning/actions/*` | Setelah progress/quiz → `awardLmsPoints()` lokal + Core XP |
| `docs/ECOSYSTEM.md` | Update §5 gamifikasi setelah implementasi |

Query leaderboard (contoh):

```sql
SELECT u.id, s.lms_points, RANK() OVER (ORDER BY s.lms_points DESC) AS rank
FROM user_lms_stats s
JOIN users u ON u.id = s.user_id
ORDER BY s.lms_points DESC
LIMIT 10;
```

---

## 7. Dependensi lintas repo

Implementasi LMS **blok** sampai minimal salah satu:

1. Core API final tanpa `currentPoints` di JWT / award response, **atau**
2. LMS bisa mengabaikan `currentPoints` Core sambil menampilkan poin lokal (transisi).

Koordinasi dengan:

- **jepangku-core** — hapus poin global, dokumentasi award XP-only
- **Portal Berita** — model poin portal sendiri + leaderboard portal

---

## 8. Mengapa ditunda (push progress dulu)

1. Perubahan schema + migrasi prod perlu koordinasi deploy.
2. UI leaderboard/profil sudah terhubung Core — refactor besar tanpa API Core final = rework.
3. Progress belajar (kursus, quiz, video) tidak tergantung poin LMS; aman di-merge/deploy dulu.
4. Draft ini menjaga keputusan produk tidak hilang saat tim lanjut sprint lain.

---

## 9. Dokumen terkait

| Dokumen | Isi |
| :--- | :--- |
| [ECOSYSTEM.md](./ECOSYSTEM.md) | Batas LMS vs Core (kondisi saat ini) |
| [CORE_INTEGRATION_STATUS.md](./CORE_INTEGRATION_STATUS.md) | Status integrasi aktual |
| [CORE_ERD.md](./CORE_ERD.md) | Konsep XP/poin Core (pre-migration) |
| `jepangku-core/docs/SCHEMA_REFERENCE.md` | Schema canonical Core |
