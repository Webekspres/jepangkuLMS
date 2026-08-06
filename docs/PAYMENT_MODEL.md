# Payment model — JepangKu LMS

**Status:** Midtrans-only + CMS grant (2026-08-06)  
**Scope:** Business rules + settle path + payment engine boundaries  
**Related:** Admin `/admin/pembayaran`; schema `Enrollment` / `Payment` / `EnrollmentLog`; code `lib/payment-engine/`, `features/checkout/`, `features/payment/`

---

## Decision (locked)

**Checkout = one product per payment.** No shopping cart.

| Approach | JepangKu |
| :--- | :--- |
| Per-item (adopted) | Yes — one `Course` / `LiveClass` / `TryoutSession` → one payment/enrollment |
| Cart (multi-line) | Out of scope |
| CMS grant | **Kept** — admin may `GRANTED` access without payment |

Bundles later are a single SKU with one `priceIdr` that grants multiple enrollments — still one checkout.

### Provider modes (`PAYMENT_PROVIDER`)

| Env | Siswa | Settle |
| :--- | :--- | :--- |
| `midtrans` | Core/Snap checkout | Webhook → `PAID` + Enrollment `ACTIVE` |
| unset / other | CTA unavailable + WhatsApp konsultasi | CMS grant only |

Manual bank-transfer bridge (`PAYMENT_PROVIDER=manual`) has been **removed**. Midtrans VA `bank_transfer` is a gateway channel, not the retired rekening bridge.

---

## Current state

```text
Course / Live Class / Tryout (priceIdr > 0, PAYMENT_PROVIDER=midtrans)
  → /dashboard/checkout/{kursus|live-class|tryout}/… → metode (ikon + grup)
  → Midtrans Core charge → Payment.instructions
  → /dashboard/pembayaran/[paymentId] + SSE (+ Cek status)
  → Webhook settle → Payment PAID + Enrollment ACTIVE
  → EnrollmentLog: REQUESTED (charge) → PAYMENT_SETTLED (first PAID)

Cancel / expire / fail / deny (terminal Payment)
  → close PENDING Enrollment (delete + EnrollmentLog REJECTED)
  → Payment ledger tetap (enrollmentId SetNull, status terminal)
  → storefront kembali ke CTA Bayar / Daftar; riwayat siswa tampil di filter status (mis. Dibatalkan)

CMS grant
  → grantEnrollmentAction → Enrollment ACTIVE + EnrollmentLog GRANTED

priceIdr <= 0 → Enrollment ACTIVE immediately (no PSP)

/dashboard/pembayaran → riwayat pembayaran siswa (Midtrans)
```

- **Access SoT:** `Enrollment.status`
- **Money SoT (Midtrans):** `Payment.status`
- Engine: `lib/payment-engine/` — `chargeProductPayment`, product resolvers, method icons under `public/payment-icons/`

---

## Admin `/admin/pembayaran`

| Tab | Role |
| :--- | :--- |
| Antrian | Default: menunggu aksi (Midtrans open `PENDING`/`CHALLENGE`, atau PENDING tanpa Payment). Filter status: Menunggu bayar \| Akses aktif \| Semua. Filter pembayaran: Semua \| Menunggu bayar \| Lunas \| Gagal/batal/expired \| Tanpa payment |
| Riwayat | `EnrollmentLog` including **Dibayar otomatis** (`PAYMENT_SETTLED`) and **Diberikan manual** (`GRANTED`) |

- Midtrans open: **Batalkan** (Cancel API + tutup enrollment). Settle hanya lewat webhook.
- Midtrans already terminal + Enrollment masih PENDING: **Hapus antrean** (delete tanpa Cancel API).
- PENDING tanpa Payment: **Tolak** (legacy orphan). Grant akses lewat kartu “Aktifkan enrollment manual”.

---

## Rules

1. Unit of sale: polymorphic product (`COURSE` | `LIVE_CLASS` | `TRYOUT`).
2. Amount = product `priceIdr` (IDR).
3. One Midtrans order → one enrollment (when Midtrans).
4. Free products never call Midtrans.
5. Paid products always require Midtrans checkout when `PAYMENT_PROVIDER=midtrans`.

---

## Midtrans status → `PaymentStatus`

| Midtrans | LMS |
| :--- | :--- |
| capture / settlement (ok) | `PAID` |
| pending | `PENDING` |
| challenge | `CHALLENGE` |
| deny | `DENIED` |
| expire | `EXPIRED` |
| cancel | `CANCELED` |
| other failure | `FAILED` |

---

## Implementation checklist

1. ✅ Payment ↔ Enrollment + Midtrans webhook/Status API
2. ✅ SSE + Core checkout UI (Course / Live / Tryout)
3. ✅ Local payment icons + grouped methods
4. ✅ Student payment history
5. ✅ Midtrans-only path (manual bank bridge removed)
6. ✅ Terminal Payment closes PENDING Enrollment (cancel + webhook)
7. ✅ `EnrollmentLog` REQUESTED + PAYMENT_SETTLED
8. ✅ Admin Antrian filters Midtrans-only + CMS grant retained

### Out of scope

- Cart, vouchers, second PSP, subscriptions, refunds
- Proof-of-transfer upload
- Backfill historical EnrollmentLog for old payments
