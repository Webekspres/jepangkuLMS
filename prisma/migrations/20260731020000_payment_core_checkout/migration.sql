-- AlterTable
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "checkoutMethod" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "instructions" JSONB;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "rawChargeResponse" JSONB;
