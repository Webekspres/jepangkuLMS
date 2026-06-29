import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { loadStudentCoreData } from '@/features/student/lib/load-student-core-data';
import { EMPTY_STUDENT_CORE_DATA } from '@/features/student/types/student-core-data';
import { getCoreSession } from '@/lib/core/get-core-session';
import { logCoreSessionUserMismatch } from '@/lib/auth/core-session-user';
import { loggers, formatErrorSummary, serializeError } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'GET /api/student/core-data' });

export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        apiLog.warn('Unauthorized core-data request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const session = await getCoreSession();
        const coreJwtSub = session?.claims.sub ?? null;
        if (coreJwtSub && coreJwtSub !== userId) {
            logCoreSessionUserMismatch(userId, coreJwtSub, 'GET /api/student/core-data');
        }
        const data = await loadStudentCoreData();
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
