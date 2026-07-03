import { auth } from '@clerk/nextjs/server';
import { getUnreadNotificationCount } from '@/lib/lms/notifications';
import { privateApiJson } from '@/lib/api/private-response';

/** GET /api/notifications/unread-count — lightweight count poll on mount. */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return privateApiJson({ error: 'Unauthorized' }, { status: 401 });

  const count = await getUnreadNotificationCount(userId);
  return privateApiJson({ count });
}
