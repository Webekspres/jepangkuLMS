# 🗄️ Database LMS — Strategi & Portabilitas

Kebijakan penyimpanan data **PostgreSQL LMS** (repo ini). **Bukan** database Core Backend (Sultan) atau Portal Berita.

**Ekosistem:** [ECOSYSTEM.md](./ECOSYSTEM.md) · **Schema:** [prisma/schema.prisma](../prisma/schema.prisma) · **Client:** [lib/prisma.ts](../lib/prisma.ts)

---

## Keputusan saat ini (Fase 1 dev)

| Lingkungan | Pilihan | Status |
| :--- | :--- | :--- |
| **Development** | **PostgreSQL lokal** (`localhost`) | ✅ Aktif |
| **Production** | Belum ditentukan (Neon, Supabase, Postgres di VPS, dll.) | ⏸️ Ditunda sampai deploy pertama |

**Tidak perlu memutuskan host DB production sekarang.** Fokus tim: vertical slice UI + backend LMS.

---

## Prinsip: scalable & adaptable

Aplikasi **tidak** mengikat diri ke satu vendor hosting DB. Abstraksi lewat:

- **Prisma ORM** — semua akses DB lewat schema + client
- **`@prisma/adapter-pg` + `pg.Pool`** — driver PostgreSQL standar (bukan engine proprietary)
- **Satu titik koneksi** — [lib/prisma.ts](../lib/prisma.ts) (singleton + pool)
- **Konfigurasi lewat env** — `DATABASE_URL`, opsional `PG_POOL_MAX`

### Pindah host DB (local → managed → VPS) biasanya hanya:

```text
1. Ganti DATABASE_URL di .env (atau secret production)
2. Jalankan migrasi ke DB baru: bun run db:migrate:deploy
3. Seed / restore data jika perlu
4. Deploy ulang app — tanpa ubah schema atau query di features/
```

| Yang berubah | Yang TIDAK berubah |
| :--- | :--- |
| `DATABASE_URL`, `PG_POOL_MAX` | `prisma/schema.prisma` |
| Env secret di CI/VPS | Kode di `features/`, `app/` |
| Proses backup/restore | `lib/prisma.ts` (kecuali tuning pool) |

---

## Aturan untuk Agent & developer

1. **Jangan** hardcode connection string di kode — selalu `process.env.DATABASE_URL` via Prisma config.
2. **Jangan** `new PrismaClient()` di luar `lib/prisma.ts` — impor `prisma` dari `@/lib/prisma`.
3. **Jangan** pakai fitur SQL spesifik satu vendor tanpa alasan kuat; schema tetap **PostgreSQL standar** (relasi, enum Prisma, `String`/`Int`/`DateTime`).
4. **Jangan** simpan profil/XP user di DB LMS — lihat [ECOSYSTEM.md](./ECOSYSTEM.md).
5. Query & Server Actions **vendor-agnostic** — asumsikan DB bisa pindah hanya dengan ganti URL.

---

## Development lokal

```bash
# .env
DATABASE_URL="postgresql://postgres:@localhost:5432/jepangku_lms?schema=public"
PG_POOL_MAX=10

bun run db:push      # atau db:migrate saat migrasi resmi ada
bun run db:seed      # setelah seed.ts siap
bun run db:studio
```

Template env: [.env.example](../.env.example)

---

## Opsi production (nanti — belum dipilih)

Semua opsi di bawah kompatibel dengan stack saat ini; keputusan ditunda hingga ~deploy MVP.

| Opsi | Catatan singkat |
| :--- | :--- |
| **Managed Postgres** (Neon, Supabase, Railway, …) | Disarankan untuk mengurangi beban backup/ops; app tetap di VPS |
| **PostgreSQL di VPS yang sama** | OK untuk MVP kecil; perhatikan backup & restart setelah PG restart |
| **Postgres terpisah di VPS lain** | Middle ground — kontrol penuh, DB tidak berebut RAM dengan Next.js |

Checklist saat memutuskan (H-3 deploy):

- [ ] Region dekat VPS (latency)
- [ ] `sslmode=require` di URL production (managed DB)
- [ ] `bun run db:migrate:deploy` ke DB prod
- [ ] Backup strategy terdokumentasi

---

## Dokumen terkait

| File | Isi |
| :--- | :--- |
| [AGENTS.md](../AGENTS.md) | Aturan Agent + ringkasan DB |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Alur data LMS |
| [jepangku-core/docs/](../../jepangku-core/docs/) | DB **Core** (terpisah, canonical) |

| Versi | Tanggal | Catatan |
| :--- | :--- | :--- |
| 1.0 | 2026-06-03 | Dev = local Postgres; prod TBD; portabilitas via Prisma + DATABASE_URL |
