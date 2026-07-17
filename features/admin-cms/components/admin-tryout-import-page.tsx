'use client';

import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { ADMIN_FORM_CARD_CLASS } from '@/features/admin-cms/lib/admin-layout';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Legacy session-bound tryout import is retired.
 * Teachers import a Paket Soal ZIP, then attach it on the session form.
 */
export function AdminTryoutImportPage() {
  return (
    <AdminPageShell
      label="Program"
      title="Import Tryout (legacy)"
      subtitle="Alur impor terikat sesi sudah diganti Paket Soal JLPT."
    >
      <Card className={cn(ADMIN_FORM_CARD_CLASS, 'space-y-4 border-amber-500/30 bg-amber-500/5 p-6')}>
        <p className="text-sm font-medium text-foreground">
          Import workbook/ZIP yang menulis langsung ke soal per sesi sudah dinonaktifkan.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>
            Impor ZIP paket di{' '}
            <Link
              className="font-medium text-foreground underline"
              href={ADMIN_ROUTES.tryoutPaketImport}
            >
              Paket Soal → Import
            </Link>{' '}
            (sheet Paket + Stimuli / Questions / Options).
          </li>
          <li>Set status paket ke READY (boleh belum lengkap 3 bagian).</li>
          <li>
            Buat/edit sesi dan pilih Paket Soal. Aktivasi sesi membutuhkan ketiga bagian JLPT.
          </li>
        </ol>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild>
            <Link href={ADMIN_ROUTES.tryoutPaketImport}>
              <Package className="size-4" />
              Import Paket
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ADMIN_ROUTES.tryoutPaket}>Daftar Paket</Link>
          </Button>
        </div>
      </Card>
    </AdminPageShell>
  );
}
