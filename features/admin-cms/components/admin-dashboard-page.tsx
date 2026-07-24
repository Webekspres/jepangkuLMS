import Link from 'next/link';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Target,
  Users,
  Video,
} from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminStatCard } from '@/features/admin-cms/components/admin-stat-card';
import { DashboardAttentionBanner } from '@/features/admin-cms/components/dashboard/dashboard-attention-banner';
import { DashboardQuickActions } from '@/features/admin-cms/components/dashboard/dashboard-quick-actions';
import { DashboardRangeToggle } from '@/features/admin-cms/components/dashboard/dashboard-range-toggle';
import { DashboardRecentActivity } from '@/features/admin-cms/components/dashboard/dashboard-recent-activity';
import { EnrollmentTrendChart } from '@/features/admin-cms/components/dashboard/charts/enrollment-trend-chart';
import { StudentGrowthChart } from '@/features/admin-cms/components/dashboard/charts/student-growth-chart';
import { TopCoursesChart } from '@/features/admin-cms/components/dashboard/charts/top-courses-chart';
import { EnrollmentMixChart } from '@/features/admin-cms/components/dashboard/charts/enrollment-mix-chart';
import { TryoutPerformanceChart } from '@/features/admin-cms/components/dashboard/charts/tryout-performance-chart';
import { LiveFillChart } from '@/features/admin-cms/components/dashboard/charts/live-fill-chart';
import { PlacementMixChart } from '@/features/admin-cms/components/dashboard/charts/placement-mix-chart';
import type { AdminDashboardInsights } from '@/features/admin-cms/lib/load-admin-dashboard-insights';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDisplayNumber } from '@/features/marketing/components/landing-data';

export function AdminDashboardPage({ insights }: { insights: AdminDashboardInsights }) {
  const { kpis, rangeDays } = insights;
  const approvalRate =
    kpis.totalEnrollments > 0
      ? Math.round((kpis.activeEnrollments / kpis.totalEnrollments) * 100)
      : 0;
  const rangeLabel = `${rangeDays} hari`;

  return (
    <AdminPageShell
      label="Admin"
      title="Dashboard"
      subtitle="Insight operasional JepangKu LMS — siswa, enrollment, belajar, dan program."
      action={<DashboardRangeToggle rangeDays={rangeDays} />}
    >
      <div className="space-y-6">
        <DashboardQuickActions />

        <DashboardAttentionBanner pendingCount={kpis.pendingEnrollments} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Total Siswa"
            value={formatDisplayNumber(kpis.studentCount)}
            delta={
              kpis.studentsNewInRange > 0
                ? `+${formatDisplayNumber(kpis.studentsNewInRange)} (${rangeLabel})`
                : undefined
            }
            description="Akun peran siswa"
            icon={Users}
          />
          <AdminStatCard
            title="Enrollment Aktif"
            value={formatDisplayNumber(kpis.activeEnrollments)}
            description={`${approvalRate}% dari ${formatDisplayNumber(kpis.totalEnrollments)} total`}
            icon={GraduationCap}
            accentClassName="bg-emerald-500/10 text-emerald-600"
          />
          <AdminStatCard
            title="Pembayaran Pending"
            value={formatDisplayNumber(kpis.pendingEnrollments)}
            description="Menunggu verifikasi admin"
            icon={Clock}
            accentClassName="bg-brand-yellow/10 text-yellow-700"
          />
          <AdminStatCard
            title="Kursus Published"
            value={formatDisplayNumber(kpis.publishedCourseCount)}
            description={`${formatDisplayNumber(kpis.courseCount)} total di database`}
            icon={BookOpen}
            accentClassName="bg-brand-orange/10 text-brand-orange"
          />
          <AdminStatCard
            title="Completion Rate"
            value={
              kpis.courseCompletionRate != null ? `${kpis.courseCompletionRate}%` : '—'
            }
            description={`${formatDisplayNumber(kpis.lessonCompletionsInRange)} lesson selesai (${rangeLabel})`}
            icon={CheckCircle2}
            accentClassName="bg-emerald-500/10 text-emerald-600"
          />
          <AdminStatCard
            title="Tryout Attempts"
            value={formatDisplayNumber(kpis.tryoutAttemptsInRange)}
            description={`${formatDisplayNumber(kpis.activeTryoutSessions)} sesi aktif · ${formatDisplayNumber(kpis.quizAttemptsInRange)} kuis (${rangeLabel})`}
            icon={Target}
            accentClassName="bg-violet-500/10 text-violet-600"
          />
          <AdminStatCard
            title="Live Class"
            value={formatDisplayNumber(kpis.upcomingLiveClasses)}
            description={`${formatDisplayNumber(kpis.publishedLiveClasses)} terpublikasi · sesi mendatang`}
            icon={Video}
            accentClassName="bg-blue-500/10 text-blue-600"
          />
          <AdminStatCard
            title="Badge Issued"
            value={formatDisplayNumber(kpis.badgesIssuedTotal)}
            delta={
              kpis.badgesIssuedInRange > 0
                ? `+${formatDisplayNumber(kpis.badgesIssuedInRange)} (${rangeLabel})`
                : undefined
            }
            description="Unlock badge LMS"
            icon={Award}
            accentClassName="bg-brand-yellow/10 text-yellow-700"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Enrollment trend</CardTitle>
              <CardDescription>Pendaftaran baru per hari ({rangeLabel}).</CardDescription>
            </CardHeader>
            <CardContent>
              <EnrollmentTrendChart data={insights.enrollmentTrend} />
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Student growth</CardTitle>
              <CardDescription>Siswa baru terdaftar ({rangeLabel}).</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentGrowthChart data={insights.studentGrowth} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Top courses</CardTitle>
              <CardDescription>Kursus dengan enrollment terbanyak.</CardDescription>
            </CardHeader>
            <CardContent>
              <TopCoursesChart data={insights.topCourses} />
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Enrollment mix</CardTitle>
              <CardDescription>Proporsi kursus, live class, dan tryout.</CardDescription>
            </CardHeader>
            <CardContent>
              <EnrollmentMixChart data={insights.enrollmentMix} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Tryout performance</CardTitle>
              <CardDescription>
                Attempt & rata-rata skor per level JLPT ({rangeLabel}).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TryoutPerformanceChart data={insights.tryoutByLevel} />
            </CardContent>
          </Card>
          <Card className="border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Live class fill</CardTitle>
              <CardDescription>Utilisasi slot kelas terpublikasi.</CardDescription>
            </CardHeader>
            <CardContent>
              <LiveFillChart data={insights.liveFill} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-border bg-card shadow-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base font-bold">Placement mix</CardTitle>
              <CardDescription>Level rekomendasi tes penempatan.</CardDescription>
            </CardHeader>
            <CardContent>
              <PlacementMixChart data={insights.placementMix} />
            </CardContent>
          </Card>
          <div className="lg:col-span-2">
            <DashboardRecentActivity items={insights.recentActivity} />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Integrasi Google Analytics & Search Console ada di{' '}
          <Link href={ADMIN_ROUTES.settings} className="underline underline-offset-2 hover:text-primary">
            Pengaturan
          </Link>
          .
        </p>
      </div>
    </AdminPageShell>
  );
}
