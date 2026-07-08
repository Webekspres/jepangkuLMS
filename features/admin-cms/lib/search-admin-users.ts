import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type AdminUserSearchResult = {
  id: string;
  resolvedDisplayName: string;
  displayName: string | null;
  ssoDisplayName: string | null;
  ssoEmail: string | null;
};

export async function searchAdminUsers(query: string, limit = 8): Promise<AdminUserSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { id: { contains: trimmed, mode: 'insensitive' } },
        { displayName: { contains: trimmed, mode: 'insensitive' } },
        { ssoDisplayName: { contains: trimmed, mode: 'insensitive' } },
        { ssoEmail: { contains: trimmed, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      displayName: true,
      ssoDisplayName: true,
      ssoEmail: true,
    },
  });

  return users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    ssoDisplayName: user.ssoDisplayName,
    ssoEmail: user.ssoEmail,
    resolvedDisplayName: resolvePublicDisplayName({
      displayName: user.displayName,
      ssoDisplayName: user.ssoDisplayName,
    }),
  }));
}
