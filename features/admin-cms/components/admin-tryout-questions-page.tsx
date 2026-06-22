'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTryoutImportPanel } from '@/features/admin-cms/components/admin-tryout-import-panel';
import {
  AdminTryoutChokaiAudioForm,
  type ChokaiAudioFormValue,
} from '@/features/admin-cms/components/admin-tryout-chokai-audio-form';
import {
  createTryoutQuestionAction,
  deleteTryoutQuestionAction,
  updateTryoutQuestionAction,
} from '@/features/admin-cms/actions/cms-tryout-question-actions';
import type {
  AdminTryoutQuestionRow,
  AdminTryoutSessionDetail,
} from '@/features/admin-cms/lib/load-admin-tryout-questions';
import {
  resolveTryoutQuestionDisplay,
  TRYOUT_SECTIONS,
  type TryoutSectionValue,
} from '@/features/admin-cms/lib/tryout-sections';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
type Level = (typeof LEVELS)[number];

type AdminTryoutQuestionsPageProps = {
  session: AdminTryoutSessionDetail;
  initialLevel: Level;
  questions: AdminTryoutQuestionRow[];
  levelCounts: Record<Level, number>;
};

function emptyOptions() {
  return [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ];
}

type FormState = {
  questionText: string;
  explanation: string;
  audioMode: ChokaiAudioFormValue['audioMode'];
  audioUrl: string;
  audioGroupId: string;
  options: { text: string; isCorrect: boolean }[];
  correctIndex: string;
};

function emptyForm(): FormState {
  return {
    questionText: '',
    explanation: '',
    audioMode: 'single',
    audioUrl: '',
    audioGroupId: '',
    options: emptyOptions(),
    correctIndex: '0',
  };
}

export function AdminTryoutQuestionsPage({
  session,
  initialLevel,
  questions,
  levelCounts,
}: AdminTryoutQuestionsPageProps) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>(initialLevel);
  const [activeSection, setActiveSection] = useState<TryoutSectionValue>('MOJI_GOI');
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

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

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm(emptyForm());
  }

  function buildPayload() {
    return {
      tryoutSessionId: session.id,
      tryoutLevel: level,
      tryoutSection: activeSection,
      questionText: form.questionText,
      explanation: form.explanation,
      audioMode: form.audioMode,
      audioUrl: activeSection === 'CHOKAI' ? form.audioUrl : '',
      audioGroupId:
        activeSection === 'CHOKAI' && form.audioMode === 'group' ? form.audioGroupId : '',
      options: form.options.map((opt, index) => ({
        text: opt.text,
        isCorrect: String(index) === form.correctIndex,
      })),
    };
  }

  function handleLevelChange(next: Level) {
    setLevel(next);
    resetForm();
    router.push(`${ADMIN_ROUTES.tryoutSessionQuestions(session.id)}?level=${next}`);
  }

  function openEdit(question: AdminTryoutQuestionRow) {
    const display = resolveTryoutQuestionDisplay({
      questionText: question.questionText,
      audioUrl: question.audioUrl,
      audioGroupId: question.audioGroupId,
    });
    const correctIndex = question.options.findIndex((o) => o.isCorrect);
    setActiveSection((question.tryoutSection ?? 'MOJI_GOI') as TryoutSectionValue);
    setEditingId(question.id);
    setShowForm(true);
    setForm({
      questionText: display.body,
      explanation: question.explanation ?? '',
      audioMode: display.audioGroupId ? 'group' : 'single',
      audioUrl: display.audioUrl ?? '',
      audioGroupId: display.audioGroupId ?? '',
      options: question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
      correctIndex: String(Math.max(0, correctIndex)),
    });
  }

  return (
    <AdminPageShell
      label="Program"
      title={`Soal Tryout — ${session.title}`}
      subtitle={`${session.phaseLabel} · ${session.code} · ${session.timeLimitMinutes} menit · 3 bagian JLPT`}
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.tryoutSessions}>
            <ArrowLeft className="size-4" />
            Kembali ke Sesi
          </Link>
        </Button>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {LEVELS.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => handleLevelChange(lv)}
            className={cn(
              'rounded-xl border px-3 py-1.5 text-sm font-semibold transition-colors',
              level === lv
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-muted/50',
            )}
          >
            {lv}
            <span className="ml-1.5 text-xs opacity-70">({levelCounts[lv]})</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <Tabs
            value={activeSection}
            onValueChange={(v) => {
              setActiveSection(v as TryoutSectionValue);
              resetForm();
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
                  {!showForm ? (
                    <Button size="sm" onClick={() => setShowForm(true)}>
                      <Plus className="size-4" />
                      Tambah Soal
                    </Button>
                  ) : null}
                </div>

                {showForm ? (
                  <Card className="border-border">
                    <CardHeader>
                      <CardTitle className="text-base">
                        {editingId ? 'Edit Soal' : 'Soal Baru'} — {section.labelRomaji} · {level}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {section.value === 'CHOKAI' ? (
                        <AdminTryoutChokaiAudioForm
                          disabled={isPending}
                          value={{
                            audioMode: form.audioMode,
                            audioUrl: form.audioUrl,
                            audioGroupId: form.audioGroupId,
                          }}
                          onChange={(next) =>
                            setForm((prev) => ({
                              ...prev,
                              audioMode: next.audioMode,
                              audioUrl: next.audioUrl,
                              audioGroupId: next.audioGroupId,
                            }))
                          }
                        />
                      ) : null}

                      <div className="space-y-2">
                        <Label>Pertanyaan</Label>
                        <Textarea
                          value={form.questionText}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, questionText: e.target.value }))
                          }
                          rows={4}
                          placeholder="Teks soal / stem…"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Penjelasan (opsional)</Label>
                        <Textarea
                          value={form.explanation}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, explanation: e.target.value }))
                          }
                          rows={2}
                        />
                      </div>

                      <div className="space-y-3">
                        <Label>Opsi jawaban — pilih satu yang benar</Label>
                        {form.options.map((opt, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${section.value}`}
                              checked={form.correctIndex === String(index)}
                              onChange={() =>
                                setForm((prev) => ({ ...prev, correctIndex: String(index) }))
                              }
                            />
                            <Input
                              value={opt.text}
                              placeholder={`Opsi ${index + 1}`}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  options: prev.options.map((row, i) =>
                                    i === index ? { ...row, text: e.target.value } : row,
                                  ),
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          disabled={isPending}
                          onClick={() => {
                            startTransition(async () => {
                              const payload = buildPayload();
                              const result = editingId
                                ? await updateTryoutQuestionAction(editingId, payload)
                                : await createTryoutQuestionAction(payload);
                              if (!result.ok) {
                                toast.error(result.message ?? 'Gagal menyimpan soal.');
                                return;
                              }
                              toast.success(editingId ? 'Soal diperbarui' : 'Soal ditambahkan');
                              resetForm();
                              router.refresh();
                            });
                          }}
                        >
                          {editingId ? 'Simpan Perubahan' : 'Simpan Soal'}
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          Batal
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}

                <div className="space-y-3">
                  {sectionQuestions.length === 0 ? (
                    <Card className="border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                      Belum ada soal di bagian {section.labelRomaji}. Tambahkan manual atau impor massal.
                    </Card>
                  ) : (
                    sectionQuestions.map((question, index) => {
                      const display = resolveTryoutQuestionDisplay({
                        questionText: question.questionText,
                        audioUrl: question.audioUrl,
                        audioGroupId: question.audioGroupId,
                      });
                      return (
                        <Card key={question.id} className="border-border">
                          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border bg-muted/20 py-4">
                            <div className="min-w-0">
                              <div className="mb-1 flex flex-wrap gap-2">
                                <Badge variant="secondary">#{question.sortOrder || index + 1}</Badge>
                                <Badge variant="outline">{section.label}</Badge>
                              </div>
                              <CardTitle className="text-base font-semibold leading-snug whitespace-pre-wrap">
                                {display.body}
                              </CardTitle>
                              {display.audioUrl ? (
                                <p className="mt-1 truncate text-xs text-primary">🎧 {display.audioUrl}</p>
                              ) : null}
                              {display.audioGroupId ? (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Grup: {display.audioGroupId}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <Button size="sm" variant="outline" onClick={() => openEdit(question)}>
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive"
                                onClick={() => setDeleteId(question.id)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-4">
                            {question.options.map((opt) => (
                              <p
                                key={opt.id}
                                className={cn(
                                  'rounded-lg border px-3 py-2 text-sm',
                                  opt.isCorrect
                                    ? 'border-emerald-500/40 bg-emerald-500/5 font-medium'
                                    : 'border-border',
                                )}
                              >
                                {opt.text}
                              </p>
                            ))}
                            {question.explanation ? (
                              <p className="text-xs text-muted-foreground">
                                Penjelasan: {question.explanation}
                              </p>
                            ) : null}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <AdminTryoutImportPanel
            sessionId={session.id}
            level={level}
            onImported={() => router.refresh()}
          />
        </aside>
      </div>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus soal tryout?"
        description="Soal akan dihapus permanen dari sesi ini."
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            const result = await deleteTryoutQuestionAction(session.id, deleteId);
            if (!result.ok) {
              toast.error(result.message ?? 'Gagal menghapus soal.');
              return;
            }
            toast.success('Soal dihapus');
            setDeleteId(null);
            router.refresh();
          });
        }}
      />
    </AdminPageShell>
  );
}
