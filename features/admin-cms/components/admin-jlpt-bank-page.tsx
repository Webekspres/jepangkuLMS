'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Download, Search, Upload } from 'lucide-react';
import {
  setJlptQuestionStatusAction,
  setListeningStimulusStatusAction,
} from '@/features/admin-cms/actions/cms-jlpt-bank-actions';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

type QuestionRow = {
  id: string;
  code: string;
  level: string;
  section: string;
  status: string;
  questionText: string;
  _count: { options: number; sessionItems: number };
  listeningStimulus: { id: string; code: string } | null;
};

type StimulusRow = {
  id: string;
  code: string;
  level: string;
  status: string;
  audioUrl: string | null;
  imageUrl: string | null;
  _count: { questions: number; sessionItems: number };
};

export function AdminJlptBankPage({
  questions,
  stimuli,
}: {
  questions: QuestionRow[];
  stimuli: StimulusRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'questions' | 'stimuli'>('questions');
  const [isPending, startTransition] = useTransition();

  function setQuestionStatus(id: string, status: 'ACTIVE' | 'RETIRED') {
    startTransition(async () => {
      const result = await setJlptQuestionStatusAction(id, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(status === 'RETIRED' ? 'Soal diarsipkan' : 'Soal diaktifkan kembali');
      router.refresh();
    });
  }

  function setStimulusStatus(id: string, status: 'ACTIVE' | 'RETIRED') {
    startTransition(async () => {
      const result = await setListeningStimulusStatusAction(id, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(status === 'RETIRED' ? 'Stimulus diarsipkan' : 'Stimulus diaktifkan kembali');
      router.refresh();
    });
  }

  const filteredQuestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (row) =>
        row.code.toLowerCase().includes(q) ||
        row.questionText.toLowerCase().includes(q) ||
        row.section.toLowerCase().includes(q),
    );
  }, [questions, query]);

  const filteredStimuli = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stimuli;
    return stimuli.filter((row) => row.code.toLowerCase().includes(q));
  }, [stimuli, query]);

  const {
    paginatedItems: paginatedQuestions,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(filteredQuestions, { resetKey: `${tab}:${query}` });

  const {
    paginatedItems: paginatedStimuli,
    page: stimPage,
    pageSize: stimPageSize,
    totalItems: stimTotal,
    setPage: setStimPage,
    setPageSize: setStimPageSize,
  } = useAdminTablePagination(filteredStimuli, { resetKey: `stim:${query}` });

  return (
    <AdminPageShell
      label="Program"
      title="Bank Soal JLPT"
      subtitle="Arsip soal & stimulus (lanjutan). Untuk bikin soal baru: buka Paket Soal."
      action={
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/api/admin/tryout/bank-template">
              <Download className="size-4" />
              Template ZIP
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href={ADMIN_ROUTES.tryoutPaket}>
              <Upload className="size-4" />
              Ke Paket Soal
            </Link>
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={tab === 'questions' ? 'default' : 'outline'}
          onClick={() => setTab('questions')}
        >
          Soal ({questions.length})
        </Button>
        <Button
          size="sm"
          variant={tab === 'stimuli' ? 'default' : 'outline'}
          onClick={() => setTab('stimuli')}
        >
          Stimulus CHOKAI ({stimuli.length})
        </Button>
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Cari kode / teks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {tab === 'questions' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Bagian</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Soal</TableHead>
                <TableHead>Opsi</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedQuestions.map((row) => (
                <TableRow key={row.id} className={row.status === 'RETIRED' ? 'opacity-60' : undefined}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.level}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{row.section}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'ACTIVE' ? 'default' : 'outline'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-sm">{row.questionText}</TableCell>
                  <TableCell>{row._count.options}</TableCell>
                  <TableCell>{row._count.sessionItems}</TableCell>
                  <TableCell className="text-right">
                    {row.status === 'RETIRED' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setQuestionStatus(row.id, 'ACTIVE')}
                      >
                        Aktifkan
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setQuestionStatus(row.id, 'RETIRED')}
                      >
                        Arsipkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTablePagination
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="soal"
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Audio</TableHead>
                <TableHead>Gambar</TableHead>
                <TableHead>Soal</TableHead>
                <TableHead>Sesi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStimuli.map((row) => (
                <TableRow key={row.id} className={row.status === 'RETIRED' ? 'opacity-60' : undefined}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.level}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'ACTIVE' ? 'default' : 'outline'}>
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.audioUrl ? '✓' : '—'}</TableCell>
                  <TableCell>{row.imageUrl ? '✓' : '—'}</TableCell>
                  <TableCell>{row._count.questions}</TableCell>
                  <TableCell>{row._count.sessionItems}</TableCell>
                  <TableCell className="text-right">
                    {row.status === 'RETIRED' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => setStimulusStatus(row.id, 'ACTIVE')}
                      >
                        Aktifkan
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={() => setStimulusStatus(row.id, 'RETIRED')}
                      >
                        Arsipkan
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminTablePagination
            page={stimPage}
            pageSize={stimPageSize}
            totalItems={stimTotal}
            onPageChange={setStimPage}
            onPageSizeChange={setStimPageSize}
            itemLabel="stimulus"
          />
        </Card>
      )}
    </AdminPageShell>
  );
}
