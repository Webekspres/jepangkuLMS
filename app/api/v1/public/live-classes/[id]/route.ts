import { getPartnerPublicLiveClassById } from '@/features/public-api/lib/load-public-live-classes';
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
import { uuidSchema } from '@/lib/validations/shared';
import { loggers } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'GET /api/v1/public/live-classes/[id]' });

type RouteContext = {
    params: Promise<{ id: string }>;
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

    const { id } = await context.params;
    const parsedId = uuidSchema.safeParse(id);
    if (!parsedId.success) {
        return partnerNotFound(request, 'Live class not found.');
    }

    const liveClass = await getPartnerPublicLiveClassById(parsedId.data);
    if (!liveClass) {
        return partnerNotFound(request, 'Live class not found.');
    }

    apiLog.debug({ id: liveClass.id }, 'Partner public live class detail loaded');

    return partnerJson(request, { data: liveClass });
}
