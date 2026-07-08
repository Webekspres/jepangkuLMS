-- Cache email utama Clerk untuk kebutuhan admin LMS (bukan sumber kebenaran profil global).
ALTER TABLE "User" ADD COLUMN "ssoEmail" VARCHAR(320);
