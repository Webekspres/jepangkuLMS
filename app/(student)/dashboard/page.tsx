import type { Metadata } from 'next';
import { DashboardPage } from '@/features/student/components';
import {
    loadDashboardContinueLessons,
    loadDashboardJlptPath,
} from '@/features/student/lib/load-student-learning-data';
import {
    loadDashboardLivePreview,
    loadDashboardWeeklyXp,
} from '@/features/student/lib/load-dashboard-extras';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Beranda — JepangKu LMS',
    description: 'Student hub — lanjutkan belajar, pantau XP, dan progress JLPT-mu.',
};

export default async function DashboardRoutePage() {
    const [continueLessons, jlptPath, weeklyXpSummary, liveSchedule] = await Promise.all([
        loadDashboardContinueLessons(),
        loadDashboardJlptPath(),
        loadDashboardWeeklyXp(),
        loadDashboardLivePreview(2),
    ]);

    // #region agent log
    fetch('http://127.0.0.1:7586/ingest/265dc3a3-e6c3-431c-a1a4-936dc8bd56f0', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd34769' }, body: JSON.stringify({ sessionId: 'd34769', location: 'dashboard/page.tsx:SSR', message: 'dashboard SSR data', data: { continueLessonCount: continueLessons.length, jlptPath: jlptPath.map((p) => ({ level: p.level, status: p.status })), weeklyXpTotal: weeklyXpSummary?.totalWeekXp ?? null }, timestamp: Date.now(), hypothesisId: 'C' }) }).catch(() => { });
    // #endregion

    return (
        <DashboardPage
            continueLessons={continueLessons}
            jlptPath={jlptPath}
            weeklyXpSummary={weeklyXpSummary}
            liveSchedule={liveSchedule}
        />
    );
}
