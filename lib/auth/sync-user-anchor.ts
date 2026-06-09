import { prisma } from '@/lib/prisma';

/** Upsert baris User jangkar LMS (FK) setelah login — profil tetap dari Core JWT */
export async function syncUserAnchor(userId: string): Promise<void> {
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });
}
