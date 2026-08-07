# Payment model — JepangKu LMS

**Status:** Dual-mode Midtrans (`snap` | `core`) + CMS grant (2026-08-07)  
**Scope:** Business rules + settle path + payment engine boundaries  
**Related:** Admin `/admin/pembayaran`; schema `Enrollment` / `Payment` / `PaymentMethodSetting` / `EnrollmentLog`; code `lib/payment-engine/`, `features/checkout/`, `features/payment/`

---

## Decision (locked)

**Checkout = one product per payment.** No shopping cart.

| Approach | JepangKu |
| :--- | :--- |
| Per-item (adopted) | Yes — one `Course` / `LiveClass` / `TryoutSession` → one payment/enrollment |
| Cart (multi-line) | Out of scope |
| CMS grant | **Kept** — admin may `GRANTED` access without payment |

### Midtrans availability & checkout mode

| Condition | Siswa | Settle |
| :--- | :--- | :--- |
| `MIDTRANS_SERVER_KEY` unset | CTA unavailable + WhatsApp | CMS grant only |
| Key set + `PAYMENT_CHECKOUT_MODE=snap` | Snap popup (methods from MAP Snap Preferences) | Webhook → Status API → ACTIVE |
| Key set + `PAYMENT_CHECKOUT_MODE=core` (default) | LMS method picker (`PaymentMethodSetting`) → Core charge | Same webhook pipeline |

**Settlement SoT is always the webhook** (`applyProviderPaymentEvent`). Snap JS callbacks (`onSuccess` / `onPending` / `onError` / `onClose`) are UX only — they never mark PAID or activate Enrollment. Closing Snap does **not** cancel Payment.

**Credentials:** match `MIDTRANS_IS_PRODUCTION` with key prefixes (`Mid-` vs `SB-`) and Snap URL. Snap mode also needs `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`.

**Flip Snap → Core** after Midtrans activates Core API Production: set `PAYMENT_CHECKOUT_MODE=core` (no schema migration). Enable methods in Admin.

---

## Current flows

```text
Course / Live Class / Tryout (priceIdr > 0)
  → /dashboard/checkout/{kursus|live-class|tryout}/…
  → SNAP: paySnapCheckout → Snap.createTransaction → Payment(snapToken) → snap.pay UX → Payment Detail + SSE
  → CORE: payCheckout(methodId) → Core charge → Payment(instructions) → Payment Detail + SSE
  → Webhook settle → Payment PAID + Enrollment ACTIVE → SSE
```

Payment↔Enrollment is 1:1 (`enrollmentId` unique). Re-charge / regenerate Snap upserts the same Payment row after best-effort cancel of the prior Midtrans order.

---

## Admin `/admin/pembayaran`

| Area | Role |
| :--- | :--- |
| Metode pembayaran | Core mode only — toggles LMS picker; Snap uses MAP Preferences |
| Antrian / Riwayat | Unchanged |

---

## Rules

1. Unit of sale: polymorphic product (`COURSE` | `LIVE_CLASS` | `TRYOUT`).
2. Amount = product `priceIdr` (IDR).
3. One Midtrans order → one enrollment.
4. Free products never call Midtrans.
5. Enrollment ACTIVE only after server-side settlement (webhook / sync Status API).
6. Snap token reuse: only when PENDING/CHALLENGE, token present, not expired, Midtrans status still open; else regenerate on same Payment.

---

## Implementation checklist

1. ✅ Webhook + Status API settlement + SSE
2. ✅ Product-agnostic checkout (Course / Live / Tryout)
3. ✅ Core charge path preserved
4. ✅ Snap interim dual-mode (`PAYMENT_CHECKOUT_MODE`)
5. ✅ Payment Detail + reopen Snap; SSE intact
6. ✅ CMS grant + Antrian Midtrans-open

### Out of scope

- Settling from Snap JS callbacks
- Cart, vouchers, second PSP
- Midtrans list-channels API (does not exist)
