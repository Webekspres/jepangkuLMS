import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loggers } from '@/lib/logger';

const tryoutLog = loggers.learning.child({ module: 'tryout-media' });

export async function POST(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    try {
        const body = (await request.json()) as {
            questionId?: string;
            optionId?: string;
            imageUrl?: string;
            sessionCode?: string;
            level?: string;
        };

        tryoutLog.error({
            userId,
            questionId: body.questionId,
            optionId: body.optionId,
            imageUrl: body.imageUrl,
            sessionCode: body.sessionCode,
            level: body.level,
            msg: 'tryout_chokai_image_load_failed',
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
}
