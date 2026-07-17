import Link from 'next/link';
import { BookOpen, ClipboardList } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { ADMIN_FORM_CARD_CLASS } from '@/features/admin-cms/lib/admin-layout';
import { Button } from '@/components/ui/button';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { cn } from '@/lib/utils';

export default function AdminQuizPage() {
  return (
    <AdminPageShell
      label="Bank Soal"
      title="Bank Soal — Kelola per Pelajaran"
      subtitle="Halaman bank soal global tidak dipakai. Soal kuis dikelola langsung di workspace setiap pelajaran."
    >
      <div className={cn(ADMIN_FORM_CARD_CLASS, 'space-y-6 rounded-2xl bg-card p-6 shadow-sm')}>
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ClipboardList className="size-6" />
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Keputusan arsitektur MVP: <strong className="text-foreground">bank soal tidak terpisah</strong>{' '}
            di <code className="rounded bg-muted px-1">/admin/quiz</code>. Admin menambah dan mengedit soal
            di dalam alur:
          </p>
          <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 font-medium text-foreground">
            Kursus → Modul → Pelajaran → tab <em>Bank Soal</em> di lesson workspace
          </p>
          <p>
            Import CSV massal untuk soal (jika diperlukan) dapat ditambahkan nanti di level pelajaran.
            Lihat <code className="rounded bg-muted px-1">docs/ADMIN_QUIZ.md</code>.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href={ADMIN_ROUTES.kursus}>
            <BookOpen className="size-4" />
            Buka Kelola Kursus
          </Link>
        </Button>
      </div>
    </AdminPageShell>
  );
}
