import type { Metadata } from 'next';
import { StudentLeaderboardPage } from '@/features/student/components/student-leaderboard-page';

export const metadata: Metadata = {
  title: 'Leaderboard — JepangKu LMS',
  description: 'Papan peringkat global siswa berdasarkan total XP.',
};

export default function DashboardLeaderboardRoutePage() {
  return <StudentLeaderboardPage />;
}
