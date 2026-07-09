import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export function KursusSayaExploreCta() {
  return (
    <section className="mt-10 rounded-2xl border border-dashed border-secondary/25 bg-secondary/5 px-6 py-10 text-center sm:px-10 sm:py-12">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
        <Compass className="size-7 text-primary" aria-hidden />
      </div>
      <h2 className="mt-5 text-xl font-bold text-brand-navy dark:text-white">
        Cari Tantangan Baru?
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        Jelajahi katalog kursus kami dan temukan kursus bahasa Jepang yang sesuai dengan level
        kamu.
      </p>
      <Button asChild variant="secondary" size="lg" className="mt-6 gap-2 px-8">
        <Link href={STUDENT_ROUTES.kursus}>
          <Compass className="size-4" />
          Lihat Katalog
        </Link>
      </Button>
    </section>
  );
}
