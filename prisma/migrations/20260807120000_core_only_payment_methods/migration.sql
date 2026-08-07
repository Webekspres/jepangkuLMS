-- Drop Snap legacy column; add admin-managed payment method settings.
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "snapToken";

CREATE TABLE IF NOT EXISTS "PaymentMethodSetting" (
    "methodId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "disabledReason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentMethodSetting_pkey" PRIMARY KEY ("methodId")
);

-- Seed catalog ids disabled until admin enables (Core-active channels only).
INSERT INTO "PaymentMethodSetting" ("methodId", "enabled", "updatedAt", "createdAt")
VALUES
  ('qris', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('gopay', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shopeepay', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('va_bca', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('va_bni', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('va_bri', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('va_mandiri', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('indomaret', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('alfamart', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("methodId") DO NOTHING;
