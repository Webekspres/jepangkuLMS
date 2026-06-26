import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadStudentCoreData } from '@/features/student/lib/load-student-core-data';
import { EMPTY_STUDENT_CORE_DATA } from '@/features/student/types/student-core-data';
import { loggers, formatErrorSummary, serializeError } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'GET /api/student/core-data' });

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        apiLog.warn('Unauthorized core-data request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const data = await loadStudentCoreData();
        // #region agent log
        fetch('http://127.0.0.1:7586/ingest/265dc3a3-e6c3-431c-a1a4-936dc8bd56f0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd34769' }, body: JSON.stringify({ sessionId: 'd34769', location: 'core-data/route.ts:GET', message: 'server core-data loaded', data: { authUserId: userId, dataUserId: data.userId, displayName: data.displayName, lmsPoints: data.lmsPoints, lmsRank: data.lmsRank, coreConnected: data.coreConnected, userIdMatch: userId === data.userId }, timestamp: Date.now(), hypothesisId: 'B,E' }) }).catch(() => { });
        // #endregion
        apiLog.debug(
            {
                userId,
                coreConnected: data.coreConnected,
                totalXp: data.totalXp,
                badgeCount: data.badgeCount,
            },
            'Student core-data loaded',
        );
        return NextResponse.json(data);
    } catch (error) {
        apiLog.warn(
            { userId, ...serializeError(error) },
            formatErrorSummary(error, 'jepangku-lms'),
        );
        return NextResponse.json(EMPTY_STUDENT_CORE_DATA);
    }
}
