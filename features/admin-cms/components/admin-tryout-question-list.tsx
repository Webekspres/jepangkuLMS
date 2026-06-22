'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Pencil, Trash2 } from 'lucide-react';
import type { LevelJLPT } from '@prisma/client';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import {
  AdminSortableListItems,
  AdminSortableListRoot,
} from '@/features/admin-cms/components/admin-sortable-list';
import {
  buildTryoutQuestionPayload,
  emptyTryoutQuestionForm,
  TryoutQuestionFormFields,
  type TryoutQuestionFormState,
} from '@/features/admin-cms/components/admin-tryout-question-form-fields';
import {
  deleteTryoutQuestionAction,
  reorderTryoutQuestionsAction,
  updateTryoutQuestionAction,
} from '@/features/admin-cms/actions/cms-tryout-question-actions';
import type { AdminTryoutQuestionRow } from '@/features/admin-cms/lib/load-admin-tryout-questions';
import {
  getTryoutSectionMeta,
  resolveTryoutQuestionDisplay,
  type TryoutSectionValue,
} from '@/features/admin-cms/lib/tryout-sections';
import { AnimatedCollapse } from '@/components/ui/animated-collapse';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type AdminTryoutQuestionListProps = {
  sessionId: string;
  level: LevelJLPT;
  section: TryoutSectionValue;
  questions: AdminTryoutQuestionRow[];
};

function questionToForm(question: AdminTryoutQuestionRow): TryoutQuestionFormState {
  const display = resolveTryoutQuestionDisplay({
    questionText: question.questionText,
    audioUrl: question.audioUrl,
    audioGroupId: question.audioGroupId,
  });
  const correctIndex = question.options.findIndex((o) => o.isCorrect);
  return {
    questionText: display.body,
    explanation: question.explanation ?? '',
    audioMode: display.audioGroupId ? 'group' : 'single',
    audioUrl: display.audioUrl ?? '',
    audioGroupId: display.audioGroupId ?? '',
    options: question.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
    correctIndex: String(Math.max(0, correctIndex)),
  };
}

export function AdminTryoutQuestionList({
  sessionId,
  level,
  section,
  questions,
}: AdminTryoutQuestionListProps) {
  const router = useRouter();
  const sectionMeta = getTryoutSectionMeta(section);
  const [items, setItems] = useState(questions);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editQuestion, setEditQuestion] = useState<AdminTryoutQuestionRow | null>(null);
  const [editForm, setEditForm] = useState<TryoutQuestionFormState>(emptyTryoutQuestionForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openEdit(question: AdminTryoutQuestionRow) {
    setEditQuestion(question);
    setEditForm(questionToForm(question));
  }

  function handleReorder(orderedIds: string[]) {
    const previous = items;
    const map = new Map(items.map((q) => [q.id, q]));
    const next = orderedIds.map((id) => map.get(id)).filter(Boolean) as AdminTryoutQuestionRow[];
    setItems(next);

    startTransition(async () => {
      const result = await reorderTryoutQuestionsAction(sessionId, level, section, orderedIds);
      if (!result.ok) {
        setItems(previous);
        toast.error(result.message ?? 'Gagal mengubah urutan.');
        return;
      }
      toast.success('Urutan soal diperbarui');
      router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <Card className="border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Belum ada soal di bagian {sectionMeta.labelRomaji}. Tambahkan manual atau impor massal.
      </Card>
    );
  }

  return (
    <>
      <AdminSortableListRoot
        items={items}
        disabled={isPending}
        onReorder={handleReorder}
        className="space-y-3"
        renderItem={(question, dragHandle) => {
          const displayIndex = items.findIndex((q) => q.id === question.id) + 1;
          const display = resolveTryoutQuestionDisplay({
            questionText: question.questionText,
            audioUrl: question.audioUrl,
            audioGroupId: question.audioGroupId,
          });
          const isOpen = expanded.has(question.id);

          return (
            <Card className="overflow-hidden border-border">
              <div className="flex items-start gap-2 border-b border-border bg-muted/20 px-3 py-3 sm:px-4">
                {dragHandle}
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  onClick={() => toggleExpanded(question.id)}
                  aria-expanded={isOpen}
                >
                  <ChevronDown
                    className={cn(
                      'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">#{displayIndex}</Badge>
                      <Badge variant="outline">{sectionMeta.label}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm font-semibold leading-snug whitespace-pre-wrap">
                      {display.body}
                    </p>
                    {display.audioUrl ? (
                      <p className="mt-1 truncate text-xs text-primary">🎧 {display.audioUrl}</p>
                    ) : null}
                  </div>
                </button>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="Edit soal"
                    onClick={() => openEdit(question)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="secondary"
                    className="border border-brand-navy/20 bg-brand-navy text-white hover:bg-brand-navy/90 hover:text-white [&_svg]:text-white"
                    aria-label="Hapus soal"
                    onClick={() => setDeleteId(question.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>

              <AnimatedCollapse open={isOpen}>
                <div className="space-y-2 px-4 py-3">
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
                </div>
              </AnimatedCollapse>
            </Card>
          );
        }}
      >
        <AdminSortableListItems />
      </AdminSortableListRoot>

      <Dialog
        open={Boolean(editQuestion)}
        onOpenChange={(open) => {
          if (!open) setEditQuestion(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit Soal #{items.findIndex((q) => q.id === editQuestion?.id) + 1} —{' '}
              {sectionMeta.labelRomaji}
            </DialogTitle>
          </DialogHeader>
          <TryoutQuestionFormFields
            form={editForm}
            section={section}
            level={level}
            disabled={isPending}
            onChange={setEditForm}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditQuestion(null)} disabled={isPending}>
              Batal
            </Button>
            <Button
              disabled={isPending || !editQuestion}
              onClick={() => {
                if (!editQuestion) return;
                startTransition(async () => {
                  const payload = buildTryoutQuestionPayload(sessionId, level, section, editForm);
                  const result = await updateTryoutQuestionAction(editQuestion.id, payload);
                  if (!result.ok) {
                    toast.error(result.message ?? 'Gagal menyimpan soal.');
                    return;
                  }
                  toast.success('Soal diperbarui');
                  setEditQuestion(null);
                  router.refresh();
                });
              }}
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus soal tryout?"
        description="Soal akan dihapus permanen dari sesi ini. Urutan nomor akan disesuaikan otomatis."
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            const result = await deleteTryoutQuestionAction(sessionId, deleteId);
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
    </>
  );
}
