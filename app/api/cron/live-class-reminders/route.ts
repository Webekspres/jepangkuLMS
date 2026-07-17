import { isCronEnabled, verifyCronRequest } from '@/lib/api/cron-auth';
import { sendLiveClassRemindersForToday } from '@/lib/lms/live-class-reminders';
import { loggers } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'POST /api/cron/live-class-reminders' });

/**
 * Kirim email reminder Live Class untuk sesi hari ini (Asia/Jakarta).
 * Server-to-server only — guard dengan `LMS_CRON_SECRET`.
 * Jadwalkan eksternal setiap 00:00 WIB.
 */
export async function POST(request: Request) {
  if (!isCronEnabled()) {
    apiLog.warn('Live class reminders rejected — LMS_CRON_SECRET not set');
    return Response.json({ error: 'Cron endpoint disabled' }, { status: 503 });
  }

  if (!verifyCronRequest(request)) {
    apiLog.warn('Live class reminders rejected — invalid cron secret');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendLiveClassRemindersForToday();
  apiLog.info(result, 'Live class reminder cron complete');

  return Response.json({ ok: true, ...result });
}
