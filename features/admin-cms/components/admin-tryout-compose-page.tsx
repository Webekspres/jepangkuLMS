'use client';

/**
 * @deprecated Session compose UI retired — route redirects to Paket Soal.
 * Kept as a thin notice if imported accidentally.
 */
import Link from 'next/link';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { ADMIN_FORM_CARD_CLASS } from '@/features/admin-cms/lib/admin-layout';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function AdminTryoutComposePage(_props: {
  session: { id: string; title: string; code: string; level: string; isActive: boolean };
  items: unknown[];
  availableQuestions: unknown[];
  availableStimuli: unknown[];
}) {
  return (
    <AdminPageShell
      label="Program"
      title="Susun sesi (legacy)"
      subtitle="Komposisi per sesi diganti Paket Soal."
    >
      <Card className={cn(ADMIN_FORM_CARD_CLASS, 'space-y-3 p-6')}>
        <p className="text-sm text-muted-foreground">
          Kelola isi ujian di Paket Soal, lalu pilih paket pada form sesi.
        </p>
        <Button asChild>
          <Link href={ADMIN_ROUTES.tryoutPaket}>Ke Paket Soal</Link>
        </Button>
      </Card>
    </AdminPageShell>
  );
}
