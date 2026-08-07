import { getPartnerPublicLiveClasses } from '@/features/public-api/lib/load-public-live-classes';
import {
    isPartnerApiEnabled,
    verifyPartnerApiRequest,
} from '@/lib/api/partner-auth';
import {
    handleCorsPreflight,
    partnerApiDisabled,
    partnerJson,
    partnerUnauthorized,
} from '@/lib/api/partner-response';
import { loggers } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'GET /api/v1/public/live-classes' });

export async function OPTIONS(request: Request) {
    return handleCorsPreflight(request) ?? new Response(null, { status: 403 });
}

export async function GET(request: Request) {
    if (!isPartnerApiEnabled()) {
        apiLog.warn('Partner API request rejected — LMS_PARTNER_API_KEY not set');
        return partnerApiDisabled(request);
    }

    if (!verifyPartnerApiRequest(request)) {
        apiLog.warn('Partner API request rejected — invalid API key');
        return partnerUnauthorized(request);
    }

    const liveClasses = await getPartnerPublicLiveClasses();
    apiLog.debug({ count: liveClasses.length }, 'Partner public live classes listed');

    return partnerJson(request, {
        data: liveClasses,
        meta: { count: liveClasses.length },
    });
}
