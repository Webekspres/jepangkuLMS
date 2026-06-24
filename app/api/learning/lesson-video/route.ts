import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { resolveLessonVideoAccess } from '@/lib/learning/lesson-video-access';
import { loggers } from '@/lib/logger';

const apiLog = loggers.api.child({ route: 'GET /api/learning/lesson-video' });

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const lessonId = new URL(request.url).searchParams.get('lessonId')?.trim();
  if (!lessonId) {
    return NextResponse.json({ error: 'lessonId required' }, { status: 400 });
  }

  const access = await resolveLessonVideoAccess(userId, lessonId);
  if (!access.ok) {
    const status =
      access.reason === 'not_found' ? 404 : access.reason === 'not_enrolled' ? 403 : 404;
    apiLog.debug({ userId, lessonId, reason: access.reason }, 'Lesson video access denied');
    return NextResponse.json({ error: access.reason }, { status });
  }

  apiLog.debug({ userId, lessonId }, 'Lesson video access granted');
  return NextResponse.json(
    { videoId: access.videoId, title: access.lessonTitle },
    {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
