import { getPartnerPublicCourseBySlug } from '@/features/public-api/lib/load-public-courses';
import {
    isPartnerApiEnabled,
    verifyPartnerApiRequest,
} from '@/lib/api/partner-auth';
import {
    handleCorsPreflight,
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

export async function OPTIONS(request: Request) {
    return handleCorsPreflight(request) ?? new Response(null, { status: 403 });
}

export async function GET(request: Request, context: RouteContext) {
    if (!isPartnerApiEnabled()) {
        apiLog.warn('Partner API request rejected — LMS_PARTNER_API_KEY not set');
        return partnerApiDisabled(request);
    }

    if (!verifyPartnerApiRequest(request)) {
        apiLog.warn('Partner API request rejected — invalid API key');
        return partnerUnauthorized(request);
    }

    const { slug } = await context.params;
    const parsedSlug = slugSchema.safeParse(slug);
    if (!parsedSlug.success) {
        return partnerNotFound(request, 'Course not found.');
    }

    const course = await getPartnerPublicCourseBySlug(parsedSlug.data);
    if (!course) {
        return partnerNotFound(request, 'Course not found.');
    }

    apiLog.debug({ slug: course.slug }, 'Partner public course detail loaded');

    return partnerJson(request, { data: course });
}
