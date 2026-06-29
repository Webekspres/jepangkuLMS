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

    return (
        <DashboardPage
            continueLessons={continueLessons}
            jlptPath={jlptPath}
            weeklyXpSummary={weeklyXpSummary}
            liveSchedule={liveSchedule}
        />
    );
}
