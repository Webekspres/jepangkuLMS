'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTryoutImportPanel } from '@/features/admin-cms/components/admin-tryout-import-panel';
import { AdminTryoutQuestionList } from '@/features/admin-cms/components/admin-tryout-question-list';
import {
  buildTryoutQuestionPayload,
  emptyTryoutQuestionForm,
  TryoutQuestionFormFields,
} from '@/features/admin-cms/components/admin-tryout-question-form-fields';
import { createTryoutQuestionAction } from '@/features/admin-cms/actions/cms-tryout-question-actions';
import type {
  AdminTryoutQuestionRow,
  AdminTryoutSessionDetail,
} from '@/features/admin-cms/lib/load-admin-tryout-questions';
import {
  TRYOUT_SECTIONS,
  type TryoutSectionValue,
} from '@/features/admin-cms/lib/tryout-sections';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AdminTryoutQuestionsPageProps = {
  session: AdminTryoutSessionDetail;
  questions: AdminTryoutQuestionRow[];
};

export function AdminTryoutQuestionsPage({ session, questions }: AdminTryoutQuestionsPageProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<TryoutSectionValue>('MOJI_GOI');
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(emptyTryoutQuestionForm);

  const sectionQuestions = useMemo(
    () => questions.filter((q) => (q.tryoutSection ?? 'MOJI_GOI') === activeSection),
    [questions, activeSection],
  );

  const sectionCounts = useMemo(() => {
    const counts: Record<TryoutSectionValue, number> = {
      MOJI_GOI: 0,
      BUNPOU_DOKKAI: 0,
      CHOKAI: 0,
    };
    for (const q of questions) {
      const key = (q.tryoutSection ?? 'MOJI_GOI') as TryoutSectionValue;
      if (key in counts) counts[key] += 1;
    }
    return counts;
  }, [questions]);

  function resetCreateForm() {
    setShowCreateForm(false);
    setCreateForm(emptyTryoutQuestionForm());
  }

  return (
    <AdminPageShell
      label="Program"
      title={`Soal Tryout — ${session.title}`}
      subtitle={`${session.phaseLabel} · ${session.code} · ${session.level} · ${session.timeLimitMinutes} menit · 3 bagian JLPT`}
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.tryoutSessions}>
            <ArrowLeft className="size-4" />
            Kembali ke Sesi
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Tabs
            value={activeSection}
            onValueChange={(v) => {
              setActiveSection(v as TryoutSectionValue);
              resetCreateForm();
            }}
          >
            <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-muted/40 p-1">
              {TRYOUT_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className="gap-2 data-[state=active]:bg-card"
                >
                  <span className={cn('size-2 rounded-full', section.color)} />
                  {section.labelRomaji}
                  <span className="text-xs opacity-60">({sectionCounts[section.value]})</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {TRYOUT_SECTIONS.map((section) => (
              <TabsContent key={section.value} value={section.value} className="space-y-4">
                <p className="text-sm text-muted-foreground">{section.description}</p>

                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {sectionQuestions.length} soal · {section.label}
                  </p>
                  {!showCreateForm ? (
                    <Button size="sm" onClick={() => setShowCreateForm(true)}>
                      <Plus className="size-4" />
                      Tambah Soal
                    </Button>
                  ) : null}
                </div>

                {showCreateForm ? (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base">
                        Soal Baru — {section.labelRomaji} · {session.level}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <TryoutQuestionFormFields
                        form={createForm}
                        section={section.value}
                        level={session.level}
                        disabled={isPending}
                        onChange={setCreateForm}
                      />
                      <div className="flex gap-2">
                        <Button
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              const payload = buildTryoutQuestionPayload(
                                session.id,
                                section.value,
                                createForm,
                              );
                              const result = await createTryoutQuestionAction(payload);
                              if (!result.ok) {
                                toast.error(result.message ?? 'Gagal menyimpan soal.');
                                return;
                              }
                              toast.success('Soal ditambahkan');
                              resetCreateForm();
                              router.refresh();
                            });
                          }}
                        >
                          Simpan Soal
                        </Button>
                        <Button variant="outline" onClick={resetCreateForm}>
                          Batal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <AdminTryoutQuestionList
                  key={`${section.value}-${sectionQuestions.map((q) => `${q.id}:${q.sortOrder}`).join('|')}`}
                  sessionId={session.id}
                  sessionLevel={session.level}
                  section={section.value}
                  questions={sectionQuestions}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <AdminTryoutImportPanel
            sessionId={session.id}
            level={session.level}
            onImported={() => router.refresh()}
          />
        </aside>
      </div>
    </AdminPageShell>
  );
}
