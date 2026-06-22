import { getPartnerPublicCourseBySlug } from '@/features/public-api/lib/load-public-courses';
import {
  isPartnerApiEnabled,
  verifyPartnerApiRequest,
} from '@/lib/api/partner-auth';
import {
  partnerApiDisabled,
  partnerJson,
  partnerNotFound,
  partnerUnauthorized,
} from '@/lib/api/partner-response';
import { slugSchema } from '@/lib/validations/shared';
import { loggers } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'GET /api/v1/public/courses/[slug]' });

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  if (!isPartnerApiEnabled()) {
    apiLog.warn('Partner API request rejected — LMS_PARTNER_API_KEY not set');
    return partnerApiDisabled();
  }

  if (!verifyPartnerApiRequest(request)) {
    apiLog.warn('Partner API request rejected — invalid API key');
    return partnerUnauthorized();
  }

  const { slug } = await context.params;
  const parsedSlug = slugSchema.safeParse(slug);
  if (!parsedSlug.success) {
    return partnerNotFound('Course not found.');
  }

  const course = await getPartnerPublicCourseBySlug(parsedSlug.data);
  if (!course) {
    return partnerNotFound('Course not found.');
  }

  apiLog.debug({ slug: course.slug }, 'Partner public course detail loaded');

  return partnerJson({ data: course });
}
