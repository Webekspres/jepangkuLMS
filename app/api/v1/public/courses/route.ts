import {
  getPartnerPublicCourses,
} from '@/features/public-api/lib/load-public-courses';
import {
  isPartnerApiEnabled,
  verifyPartnerApiRequest,
} from '@/lib/api/partner-auth';
import {
  partnerApiDisabled,
  partnerJson,
  partnerUnauthorized,
} from '@/lib/api/partner-response';
import { loggers } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'GET /api/v1/public/courses' });

export async function GET(request: Request) {
  if (!isPartnerApiEnabled()) {
    apiLog.warn('Partner API request rejected — LMS_PARTNER_API_KEY not set');
    return partnerApiDisabled();
  }

  if (!verifyPartnerApiRequest(request)) {
    apiLog.warn('Partner API request rejected — invalid API key');
    return partnerUnauthorized();
  }

  const courses = await getPartnerPublicCourses();
  apiLog.debug({ count: courses.length }, 'Partner public courses listed');

  return partnerJson({
    data: courses,
    meta: { count: courses.length },
  });
}
