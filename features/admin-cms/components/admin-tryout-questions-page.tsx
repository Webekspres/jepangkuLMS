'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createTryoutQuestionAction,
  deleteTryoutQuestionAction,
  updateTryoutQuestionAction,
} from '@/features/admin-cms/actions/cms-tryout-question-actions';
import type {
  AdminTryoutQuestionRow,
  AdminTryoutSessionDetail,
} from '@/features/admin-cms/lib/load-admin-tryout-questions';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const SECTIONS = [
  { value: 'MOJI_GOI', label: 'Moji·Goi' },
  { value: 'BUNPOU_DOKKAI', label: 'Bunpou·Dokkai' },
  { value: 'CHOKAI', label: 'Chokai' },
] as const;

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

export function AdminTryoutQuestionsPage({
  session,
  initialLevel,
  questions,
  levelCounts,
}: AdminTryoutQuestionsPageProps) {
  const router = useRouter();
  const [level, setLevel] = useState<Level>(initialLevel);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tryoutSection: 'MOJI_GOI' as (typeof SECTIONS)[number]['value'],
    questionText: '',
    explanation: '',
    options: emptyOptions(),
    correctIndex: '0',
  });

  const sectionLabel = useMemo(
    () => Object.fromEntries(SECTIONS.map((s) => [s.value, s.label])),
    [],
  );

  function resetForm() {
    setEditingId(null);
    setShowForm(false);
    setForm({
      tryoutSection: 'MOJI_GOI',
      questionText: '',
      explanation: '',
      options: emptyOptions(),
      correctIndex: '0',
    });
  }

  function buildPayload() {
    return {
      tryoutSessionId: session.id,
      tryoutLevel: level,
      tryoutSection: form.tryoutSection,
      questionText: form.questionText,
      explanation: form.explanation,
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

  return (
    <AdminPageShell
      label="Program"
      title={`Soal Tryout — ${session.title}`}
      subtitle={`${session.phaseLabel} · kode ${session.code} · ${session.timeLimitMinutes} menit`}
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

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {questions.length} soal untuk level {level}
        </p>
        {!showForm ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            Tambah Soal
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <Card className="mb-6 border-border">
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? 'Edit Soal' : 'Soal Baru'} — {level}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Bagian ujian</Label>
              <Select
                value={form.tryoutSection}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    tryoutSection: value as (typeof SECTIONS)[number]['value'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((section) => (
                    <SelectItem key={section.value} value={section.value}>
                      {section.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pertanyaan</Label>
              <Textarea
                value={form.questionText}
                onChange={(e) => setForm((prev) => ({ ...prev, questionText: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Penjelasan (opsional)</Label>
              <Textarea
                value={form.explanation}
                onChange={(e) => setForm((prev) => ({ ...prev, explanation: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label>Opsi jawaban</Label>
              {form.options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correctIndex === String(index)}
                    onChange={() => setForm((prev) => ({ ...prev, correctIndex: String(index) }))}
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

      <div className="space-y-4">
        {questions.length === 0 ? (
          <Card className="border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Belum ada soal untuk level {level}. Tambahkan soal pertama di atas.
          </Card>
        ) : (
          questions.map((question, index) => (
            <Card key={question.id} className="border-border">
              <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border bg-muted/20 py-4">
                <div>
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge variant="secondary">Soal {index + 1}</Badge>
                    <Badge variant="outline">
                      {sectionLabel[question.tryoutSection] ?? question.tryoutSection}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold leading-snug">
                    {question.questionText}
                  </CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const correctIndex = question.options.findIndex((o) => o.isCorrect);
                      setEditingId(question.id);
                      setShowForm(true);
                      setForm({
                        tryoutSection: question.tryoutSection as (typeof SECTIONS)[number]['value'],
                        questionText: question.questionText,
                        explanation: question.explanation ?? '',
                        options: question.options.map((o) => ({
                          text: o.text,
                          isCorrect: o.isCorrect,
                        })),
                        correctIndex: String(Math.max(0, correctIndex)),
                      });
                    }}
                  >
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
                  <p className="text-xs text-muted-foreground">Penjelasan: {question.explanation}</p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
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
