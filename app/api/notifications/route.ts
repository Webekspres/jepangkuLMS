import { auth } from '@clerk/nextjs/server';
import { loadUserNotifications } from '@/lib/lms/notifications';
import { privateApiJson } from '@/lib/api/private-response';

/** GET /api/notifications — full notification list, only fetched when dropdown is open. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return privateApiJson({ error: 'Unauthorized' }, { status: 401 });

  const items = await loadUserNotifications(userId, 25);
  return privateApiJson({ items });
}
