'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, ImageIcon, Loader2, Lock, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import {
  createChokaiInSetAction,
  createQuestionInSetAction,
  removeSetItemAction,
  renumberChokaiMondaiInSetAction,
  setJlptQuestionSetStatusAction,
  updateChokaiSetItemAction,
  updateJlptQuestionSetChokaiAudioAction,
  updateJlptQuestionSetMetaAction,
  updateQuestionInSetAction,
} from '@/features/admin-cms/actions/cms-jlpt-question-set-actions';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import type { AdminJlptQuestionSetDetail } from '@/features/admin-cms/lib/load-admin-jlpt-question-sets';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger, TabCountBadge } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  getTryoutExamBlocks,
  isCombinedLanguageKnowledgeLevel,
  type TryoutExamBlockId,
} from '@/features/admin-cms/lib/tryout-exam-blocks';
import { getTryoutSectionMeta } from '@/features/admin-cms/lib/tryout-sections';

type KnowledgeSection = 'MOJI_GOI' | 'BUNPOU_DOKKAI';

function knowledgeSectionBadge(section: string) {
  if (section === 'MOJI_GOI') return 'Vocabulary';
  if (section === 'BUNPOU_DOKKAI') return 'Grammar · Reading';
  return getTryoutSectionMeta(section).label;
}

function SortableMondaiTabTrigger({
  id,
  label,
  count,
  disabled,
}: {
  id: string;
  label: string;
  count: number;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn('shrink-0', isDragging && 'z-10 opacity-70')}
      {...attributes}
      {...listeners}
    >
      <TabsTrigger value={id} className="text-xs sm:text-sm" disabled={disabled}>
        {label}
        <TabCountBadge count={count} />
      </TabsTrigger>
    </div>
  );
}

type QuestionDraft = {
  questionText: string;
  explanation: string;
  options: { text: string; isCorrect: boolean }[];
};

function emptyOptions() {
  return [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ];
}

function OptionsEditor({
  options,
  correctIndex,
  name,
  onOptionsChange,
  onCorrectChange,
}: {
  options: { text: string; isCorrect: boolean }[];
  correctIndex: string;
  name: string;
  onOptionsChange: (next: { text: string; isCorrect: boolean }[]) => void;
  onCorrectChange: (index: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Opsi — pilih yang benar</Label>
      {options.map((opt, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="radio"
            name={name}
            checked={correctIndex === String(index)}
            onChange={() => onCorrectChange(String(index))}
          />
          <Input
            value={opt.text}
            placeholder={`Opsi ${index + 1}`}
            onChange={(e) =>
              onOptionsChange(
                options.map((row, i) => (i === index ? { ...row, text: e.target.value } : row)),
              )
            }
          />
        </div>
      ))}
    </div>
  );
}

function MojiBunpouForm({
  section,
  locked,
  disabled,
  initial,
  allowSectionPick = false,
  onCancel,
  onSubmit,
}: {
  section: KnowledgeSection;
  locked: boolean;
  disabled: boolean;
  initial?: QuestionDraft | null;
  /** N1/N2 combined tab — admin picks Vocabulary vs Grammar · Reading. */
  allowSectionPick?: boolean;
  onCancel?: () => void;
  onSubmit: (data: QuestionDraft & { section: KnowledgeSection }) => void;
}) {
  const isEdit = Boolean(initial);
  const [open, setOpen] = useState(isEdit);
  const [pickedSection, setPickedSection] = useState<KnowledgeSection>(section);
  const [questionText, setQuestionText] = useState(initial?.questionText ?? '');
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [options, setOptions] = useState(() => {
    if (!initial) return emptyOptions();
    const opts = [...initial.options];
    while (opts.length < 4) opts.push({ text: '', isCorrect: false });
    return opts;
  });
  const [correctIndex, setCorrectIndex] = useState(() => {
    if (!initial) return '0';
    return String(Math.max(0, initial.options.findIndex((o) => o.isCorrect)));
  });

  if (locked) return null;
  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Tambah soal
      </Button>
    );
  }

  function closeForm() {
    if (isEdit) {
      onCancel?.();
      return;
    }
    setOpen(false);
    setQuestionText('');
    setExplanation('');
    setOptions(emptyOptions());
    setCorrectIndex('0');
    setPickedSection(section);
  }

  const effectiveSection = allowSectionPick && !isEdit ? pickedSection : section;

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      {isEdit ? (
        <p className="text-xs font-medium text-muted-foreground">Edit soal</p>
      ) : null}
      {allowSectionPick && !isEdit ? (
        <div className="space-y-2">
          <Label>Jenis soal</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={pickedSection}
            onChange={(e) => setPickedSection(e.target.value as KnowledgeSection)}
            disabled={disabled}
          >
            <option value="MOJI_GOI">Vocabulary</option>
            <option value="BUNPOU_DOKKAI">Grammar · Reading</option>
          </select>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>Pertanyaan</Label>
        <Textarea
          rows={3}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="Teks soal…"
        />
      </div>
      <OptionsEditor
        name={`correct-${effectiveSection}-${isEdit ? 'edit' : 'add'}`}
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />
      <div className="space-y-2">
        <Label>Pembahasan (opsional)</Label>
        <Textarea
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Penjelasan jawaban…"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={disabled}
          onClick={() => {
            onSubmit({
              section: effectiveSection,
              questionText,
              explanation,
              options: options.map((o, i) => ({
                text: o.text,
                isCorrect: String(i) === correctIndex,
              })),
            });
            if (!isEdit) closeForm();
          }}
        >
          {isEdit ? 'Simpan perubahan' : 'Simpan soal'}
        </Button>
      </div>
    </div>
  );
}

function ChokaiForm({
  level,
  locked,
  disabled,
  mondaiOrder,
  questionSetId,
  packageCode,
  initial,
  onCancel,
  onSubmit,
}: {
  level: string;
  locked: boolean;
  disabled: boolean;
  /** Injected from Mondai group context — not editable in the form. */
  mondaiOrder: number;
  questionSetId: string;
  packageCode: string;
  initial?: (QuestionDraft & {
    imageUrl: string | null;
    imageObjectKey?: string | null;
  }) | null;
  onCancel?: () => void;
  onSubmit: (data: {
    questionText: string;
    explanation: string;
    options: { text: string; isCorrect: boolean }[];
    imageUrl: string | null;
    imageObjectKey: string | null;
    mondaiOrder: number;
  }) => void;
}) {
  const isEdit = Boolean(initial);
  const imageRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(isEdit);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [imageObjectKey, setImageObjectKey] = useState<string | null>(
    initial?.imageObjectKey ?? null,
  );
  const [questionText, setQuestionText] = useState(initial?.questionText ?? '');
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [options, setOptions] = useState(() => {
    if (!initial) return emptyOptions();
    const opts = [...initial.options];
    while (opts.length < 4) opts.push({ text: '', isCorrect: false });
    return opts;
  });
  const [correctIndex, setCorrectIndex] = useState(() => {
    if (!initial) return '0';
    return String(Math.max(0, initial.options.findIndex((o) => o.isCorrect)));
  });

  async function uploadImage(file: File) {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('level', level);
      form.set('code', packageCode);
      form.set('questionSetId', questionSetId);
      form.set('mondaiOrder', String(mondaiOrder));
      const res = await fetch('/api/admin/tryout/upload-image', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      const json = (await res.json()) as {
        ok: boolean;
        url?: string;
        objectKey?: string;
        message?: string;
      };
      if (!json.ok || !json.url) {
        toast.error(json.message ?? 'Upload gambar gagal');
        return;
      }
      setImageUrl(json.url);
      setImageObjectKey(json.objectKey ?? null);
      toast.success('Gambar penunjuk terunggah');
    } catch {
      toast.error('Upload gambar gagal');
    } finally {
      setUploadingImage(false);
    }
  }

  if (locked) return null;
  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3 w-full"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Tambah soal
      </Button>
    );
  }

  function closeForm() {
    if (isEdit) {
      onCancel?.();
      return;
    }
    setOpen(false);
    setQuestionText('');
    setExplanation('');
    setImageUrl(null);
    setImageObjectKey(null);
    setOptions(emptyOptions());
    setCorrectIndex('0');
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-3">
      {isEdit ? (
        <p className="text-xs font-medium text-muted-foreground">Edit soal</p>
      ) : null}

      <div className="space-y-2">
        <Label>Gambar penunjuk (opsional)</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploadingImage || disabled}
            onClick={() => imageRef.current?.click()}
          >
            {uploadingImage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ImageIcon className="size-4" />
            )}
            Unggah gambar
          </Button>
          <input
            ref={imageRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadImage(f);
            }}
          />
          {imageUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setImageUrl(null);
                setImageObjectKey(null);
              }}
            >
              Hapus gambar
            </Button>
          ) : null}
        </div>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Gambar penunjuk Choukai"
            className="max-h-40 rounded-md border border-border object-contain"
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Pertanyaan</Label>
        <Textarea
          rows={2}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          placeholder="1 ばん / どれですか。"
        />
      </div>

      <OptionsEditor
        name={`correct-chokai-${isEdit ? 'edit' : 'add'}`}
        options={options}
        correctIndex={correctIndex}
        onOptionsChange={setOptions}
        onCorrectChange={setCorrectIndex}
      />

      <div className="space-y-2">
        <Label>Penjelasan (opsional)</Label>
        <Input value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={closeForm}>
          Batal
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={disabled || uploadingImage}
          onClick={() => {
            onSubmit({
              questionText,
              explanation,
              imageUrl,
              imageObjectKey,
              mondaiOrder: Math.max(1, Math.trunc(mondaiOrder) || 1),
              options: options.map((o, i) => ({
                text: o.text,
                isCorrect: String(i) === correctIndex,
              })),
            });
            if (!isEdit) closeForm();
          }}
        >
          {isEdit ? 'Simpan perubahan' : 'Simpan soal'}
        </Button>
      </div>
    </div>
  );
}

export function AdminJlptPaketDetailPage({ detail }: { detail: AdminJlptQuestionSetDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [sectionTab, setSectionTab] = useState<TryoutExamBlockId>(() =>
    getTryoutExamBlocks(detail.level)[0]!.id,
  );
  const [activeMondaiOrder, setActiveMondaiOrder] = useState<number | null>(null);
  const [draftMondaiOrders, setDraftMondaiOrders] = useState<number[]>([]);
  const [uploadingPackageAudio, setUploadingPackageAudio] = useState(false);
  const packageAudioRef = useRef<HTMLInputElement>(null);
  const pendingMondaiSync = useRef<{ drafts: number[]; active: number | null } | null>(null);
  const locked = detail.stats.isContentLocked;
  const packageHasMasterAudio = Boolean(detail.chokaiAudioUrl?.trim());

  const itemsBySection = useMemo(() => {
    const map: Record<string, typeof detail.items> = {
      MOJI_GOI: [],
      BUNPOU_DOKKAI: [],
      CHOKAI: [],
    };
    for (const item of detail.items) {
      (map[item.section] ??= []).push(item);
    }
    return map;
  }, [detail]);

  const examBlocks = useMemo(() => getTryoutExamBlocks(detail.level), [detail.level]);
  const isCombinedLangLevel = isCombinedLanguageKnowledgeLevel(detail.level);

  const languageKnowledgeItems = useMemo(() => {
    return [...(itemsBySection.MOJI_GOI ?? []), ...(itemsBySection.BUNPOU_DOKKAI ?? [])];
  }, [itemsBySection]);

  const blockCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const block of examBlocks) {
      map[block.id] = block.sections.reduce((sum, section) => {
        const items = itemsBySection[section] ?? [];
        return sum + items.reduce((n, i) => n + i.questionCount, 0);
      }, 0);
    }
    return map;
  }, [examBlocks, itemsBySection]);


  const chokaiItemsByMondai = useMemo(() => {
    const chokaiItems = itemsBySection.CHOKAI ?? [];
    const map = new Map<number, typeof chokaiItems>();
    for (const item of chokaiItems) {
      const order = Math.max(1, item.editData?.mondaiOrder ?? 1);
      const list = map.get(order) ?? [];
      list.push(item);
      map.set(order, list);
    }
    return map;
  }, [itemsBySection]);

  /** Drafts that are not yet backed by real items (derived — no prune effect). */
  const visibleDraftMondaiOrders = useMemo(
    () => draftMondaiOrders.filter((n) => !chokaiItemsByMondai.has(n)),
    [draftMondaiOrders, chokaiItemsByMondai],
  );

  const mondaiList = useMemo(() => {
    const orders = new Set<number>([...chokaiItemsByMondai.keys(), ...visibleDraftMondaiOrders]);
    return [...orders].sort((a, b) => a - b).map((order) => ({
      order,
      items: chokaiItemsByMondai.get(order) ?? [],
      isDraft: visibleDraftMondaiOrders.includes(order),
      soalCount: (chokaiItemsByMondai.get(order) ?? []).reduce((n, i) => n + i.questionCount, 0),
    }));
  }, [chokaiItemsByMondai, visibleDraftMondaiOrders]);

  /** Controlled tab value — fall back to first mondai without syncing in an effect. */
  const selectedMondaiOrder = useMemo(() => {
    if (mondaiList.length === 0) return null;
    if (activeMondaiOrder != null && mondaiList.some((g) => g.order === activeMondaiOrder)) {
      return activeMondaiOrder;
    }
    return mondaiList[0]!.order;
  }, [mondaiList, activeMondaiOrder]);

  // Apply remumber result after router.refresh() replaces `detail`.
  useEffect(() => {
    const pending = pendingMondaiSync.current;
    if (!pending) return;
    pendingMondaiSync.current = null;
    queueMicrotask(() => {
      setDraftMondaiOrders(pending.drafts);
      setActiveMondaiOrder(pending.active);
      setEditingItemId(null);
    });
  }, [detail]);

  const mondaiSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function queueMondaiSyncAfterRenumber(
    orderedOldOrders: number[],
    emptyKeys: Set<number>,
    activeOld: number | null,
  ) {
    const drafts = orderedOldOrders
      .map((old, index) => (emptyKeys.has(old) ? index + 1 : null))
      .filter((n): n is number => n != null);
    const idx = activeOld != null ? orderedOldOrders.indexOf(activeOld) : -1;
    pendingMondaiSync.current = {
      drafts,
      active: idx >= 0 ? idx + 1 : orderedOldOrders.length > 0 ? 1 : null,
    };
  }

  function persistMondaiSequence(orderedOldOrders: number[], activeOld: number | null) {
    const emptyKeys = new Set(
      orderedOldOrders.filter((order) => (chokaiItemsByMondai.get(order)?.length ?? 0) === 0),
    );

    startTransition(async () => {
      const result = await renumberChokaiMondaiInSetAction({
        questionSetId: detail.id,
        orderedOldOrders,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      queueMondaiSyncAfterRenumber(orderedOldOrders, emptyKeys, activeOld);
      router.refresh();
    });
  }

  function handleMeta(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateJlptQuestionSetMetaAction(detail.id, formData);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Judul disimpan');
      router.refresh();
    });
  }

  function handleStatus(status: 'DRAFT' | 'READY' | 'ARCHIVED') {
    startTransition(async () => {
      const result = await setJlptQuestionSetStatusAction(detail.id, status);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(status === 'READY' ? 'Paket siap dipakai sesi' : `Status → ${status}`);
      router.refresh();
    });
  }

  function handleCreateMojiBunpou(data: QuestionDraft & { section: KnowledgeSection }) {
    startTransition(async () => {
      const result = await createQuestionInSetAction({
        questionSetId: detail.id,
        section: data.section,
        questionText: data.questionText,
        explanation: data.explanation,
        options: data.options,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Soal ditambahkan');
      router.refresh();
    });
  }

  async function uploadPackageChokaiAudio(file: File) {
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      toast.error('Audio harus .mp3');
      return;
    }
    setUploadingPackageAudio(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('questionSetId', detail.id);
      const res = await fetch('/api/admin/tryout/upload-audio', {
        method: 'POST',
        body: form,
        credentials: 'same-origin',
      });
      const json = (await res.json()) as {
        ok: boolean;
        url?: string;
        objectKey?: string;
        message?: string;
      };
      if (!json.ok || !json.url) {
        toast.error(json.message ?? 'Upload audio gagal');
        return;
      }
      const result = await updateJlptQuestionSetChokaiAudioAction({
        questionSetId: detail.id,
        audioUrl: json.url,
        audioObjectKey: json.objectKey ?? null,
        audioOriginalName: file.name,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Audio Choukai paket tersimpan');
      router.refresh();
    } catch {
      toast.error('Upload audio gagal');
    } finally {
      setUploadingPackageAudio(false);
    }
  }

  function handleClearPackageChokaiAudio() {
    startTransition(async () => {
      const result = await updateJlptQuestionSetChokaiAudioAction({
        questionSetId: detail.id,
        audioUrl: null,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Audio Choukai paket dihapus');
      router.refresh();
    });
  }

  function handleCreateChokai(data: {
    questionText: string;
    explanation: string;
    options: { text: string; isCorrect: boolean }[];
    imageUrl: string | null;
    imageObjectKey: string | null;
    mondaiOrder: number;
  }) {
    startTransition(async () => {
      const result = await createChokaiInSetAction({
        questionSetId: detail.id,
        questionText: data.questionText,
        explanation: data.explanation,
        instructionText: '',
        options: data.options,
        audioUrl: null,
        imageUrl: data.imageUrl,
        imageObjectKey: data.imageObjectKey,
        mondaiOrder: data.mondaiOrder,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      const ordered = mondaiList.map((g) => g.order);
      const emptyKeys = new Set(
        mondaiList
          .filter((g) => g.order !== data.mondaiOrder && g.soalCount === 0)
          .map((g) => g.order),
      );

      const renumber = await renumberChokaiMondaiInSetAction({
        questionSetId: detail.id,
        orderedOldOrders: ordered,
      });
      if (!renumber.ok) {
        toast.error(renumber.message);
        router.refresh();
        return;
      }

      queueMondaiSyncAfterRenumber(ordered, emptyKeys, data.mondaiOrder);
      toast.success('Soal Choukai ditambahkan');
      router.refresh();
    });
  }

  function handleRemove(itemId: string, mondaiMeta?: { mondaiOrder: number; isLastInMondai: boolean }) {
    startTransition(async () => {
      const result = await removeSetItemAction(itemId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      if (mondaiMeta?.isLastInMondai) {
        const order = mondaiMeta.mondaiOrder;
        setDraftMondaiOrders((prev) => (prev.includes(order) ? prev : [...prev, order]));
      }
      toast.success('Soal dihapus dari paket');
      setEditingItemId(null);
      router.refresh();
    });
  }

  function handleUpdateMojiBunpou(
    itemId: string,
    data: QuestionDraft & { section: KnowledgeSection },
  ) {
    startTransition(async () => {
      const result = await updateQuestionInSetAction({
        itemId,
        questionText: data.questionText,
        explanation: data.explanation,
        options: data.options,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Soal diperbarui');
      setEditingItemId(null);
      router.refresh();
    });
  }

  function handleUpdateChokai(
    itemId: string,
    data: {
      questionText: string;
      explanation: string;
      options: { text: string; isCorrect: boolean }[];
      imageUrl: string | null;
      imageObjectKey: string | null;
      mondaiOrder: number;
    },
  ) {
    startTransition(async () => {
      const result = await updateChokaiSetItemAction({
        itemId,
        questionText: data.questionText,
        explanation: data.explanation,
        instructionText: '',
        options: data.options,
        audioUrl: undefined,
        imageUrl: data.imageUrl,
        imageObjectKey: data.imageObjectKey,
        mondaiOrder: data.mondaiOrder,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Soal Choukai diperbarui');
      setEditingItemId(null);
      router.refresh();
    });
  }

  function handleAddMondai() {
    const maxExisting = mondaiList.reduce((max, g) => Math.max(max, g.order), 0);
    const nextOrder = maxExisting + 1;
    setDraftMondaiOrders((prev) => (prev.includes(nextOrder) ? prev : [...prev, nextOrder]));
    setActiveMondaiOrder(nextOrder);
    setEditingItemId(null);
  }

  function handleDeleteEmptyDraftMondai(order: number) {
    const group = mondaiList.find((g) => g.order === order);
    if (!group?.isDraft) return;
    const remaining = mondaiList.filter((g) => g.order !== order).map((g) => g.order);
    if (remaining.length === 0) {
      setDraftMondaiOrders([]);
      setActiveMondaiOrder(null);
      setEditingItemId(null);
      return;
    }
    const nextActive = activeMondaiOrder === order ? remaining[0]! : activeMondaiOrder;
    persistMondaiSequence(remaining, nextActive);
  }

  function handleMondaiDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = mondaiList.map((g) => String(g.order));
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(mondaiList, oldIndex, newIndex).map((g) => g.order);
    persistMondaiSequence(next, activeMondaiOrder);
  }

  return (
    <AdminPageShell
      label="Program"
      title={detail.title}
      subtitle={`${detail.level} · ${detail.stats.totalQuestions} soal · ${detail.stats.jlptCompleteness.label} bagian lengkap`}
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.tryoutPaket}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      {locked ? (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <Lock className="size-4 text-amber-600" />
            Paket terkunci — dipakai {detail.stats.activeSessionCount} sesi aktif
          </p>
          <p className="mt-1 text-muted-foreground">
            Nonaktifkan sesi dulu, atau duplikat paket untuk mengedit isi.
          </p>
        </Card>
      ) : null}

      <Card className="mb-4 border-border p-4">
        <form onSubmit={handleMeta} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="title">Judul paket</Label>
            <Input id="title" name="title" defaultValue={detail.title} required />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={detail.status === 'READY' ? 'default' : 'secondary'}>
              {detail.status}
            </Badge>
            <Button type="submit" size="sm" disabled={isPending}>
              Simpan
            </Button>
            {detail.status !== 'READY' ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={isPending}
                onClick={() => handleStatus('READY')}
              >
                Siap dipakai
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleStatus('ARCHIVED')}
              >
                Arsipkan
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Tabs
        value={
          examBlocks.some((b) => b.id === sectionTab) ? sectionTab : examBlocks[0]!.id
        }
        onValueChange={(value) => {
          const next = value as TryoutExamBlockId;
          setSectionTab(next);
          setEditingItemId(null);
          if (next !== 'LISTENING') {
            setActiveMondaiOrder(null);
          } else if (mondaiList.length > 0) {
            setActiveMondaiOrder(mondaiList[0]!.order);
          }
        }}
        className="gap-4"
      >
        <TabsList variant="line">
          {examBlocks.map((block) => (
            <TabsTrigger key={block.id} value={block.id}>
              {block.shortLabel}
              <TabCountBadge count={blockCounts[block.id] ?? 0} />
            </TabsTrigger>
          ))}
        </TabsList>

        {isCombinedLangLevel ? (
          <TabsContent value="LANG_READING" className="mt-0">
            <Card className="border-border p-4">
              <ul className="space-y-2">
                {languageKnowledgeItems.length === 0 ? (
                  <li className="text-sm text-muted-foreground">Belum ada soal.</li>
                ) : (
                  languageKnowledgeItems.map((item) => (
                    <li key={item.id} className="space-y-2">
                      <div className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                        <div className="min-w-0 flex-1 space-y-1">
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {knowledgeSectionBadge(item.section)}
                          </Badge>
                          <span className="block wrap-break-word">{item.label}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isPending || locked || !item.editData}
                            onClick={() =>
                              setEditingItemId((prev) => (prev === item.id ? null : item.id))
                            }
                            aria-label="Edit soal"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            disabled={isPending || locked}
                            onClick={() => handleRemove(item.id)}
                            aria-label="Hapus"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {editingItemId === item.id && item.editData ? (
                        <MojiBunpouForm
                          key={`edit-${item.id}`}
                          section={item.section as KnowledgeSection}
                          locked={locked}
                          disabled={isPending}
                          initial={{
                            questionText: item.editData.questionText,
                            explanation: item.editData.explanation,
                            options: item.editData.options,
                          }}
                          onCancel={() => setEditingItemId(null)}
                          onSubmit={(data) => handleUpdateMojiBunpou(item.id, data)}
                        />
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
              {editingItemId && languageKnowledgeItems.some((i) => i.id === editingItemId) ? null : (
                <MojiBunpouForm
                  section="MOJI_GOI"
                  allowSectionPick
                  locked={locked}
                  disabled={isPending}
                  onSubmit={handleCreateMojiBunpou}
                />
              )}
            </Card>
          </TabsContent>
        ) : (
          (['VOCAB', 'GRAMMAR_READING'] as const).map((blockId) => {
            const section: KnowledgeSection =
              blockId === 'VOCAB' ? 'MOJI_GOI' : 'BUNPOU_DOKKAI';
            const items = itemsBySection[section] ?? [];
            return (
              <TabsContent key={blockId} value={blockId} className="mt-0">
                <Card className="border-border p-4">
                  <ul className="space-y-2">
                    {items.length === 0 ? (
                      <li className="text-sm text-muted-foreground">Belum ada soal.</li>
                    ) : (
                      items.map((item) => (
                        <li key={item.id} className="space-y-2">
                          <div className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                            <span className="min-w-0 flex-1 wrap-break-word">{item.label}</span>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={isPending || locked || !item.editData}
                                onClick={() =>
                                  setEditingItemId((prev) =>
                                    prev === item.id ? null : item.id,
                                  )
                                }
                                aria-label="Edit soal"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                disabled={isPending || locked}
                                onClick={() => handleRemove(item.id)}
                                aria-label="Hapus"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                          {editingItemId === item.id && item.editData ? (
                            <MojiBunpouForm
                              key={`edit-${item.id}`}
                              section={section}
                              locked={locked}
                              disabled={isPending}
                              initial={{
                                questionText: item.editData.questionText,
                                explanation: item.editData.explanation,
                                options: item.editData.options,
                              }}
                              onCancel={() => setEditingItemId(null)}
                              onSubmit={(data) => handleUpdateMojiBunpou(item.id, data)}
                            />
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                  {editingItemId && items.some((i) => i.id === editingItemId) ? null : (
                    <MojiBunpouForm
                      section={section}
                      locked={locked}
                      disabled={isPending}
                      onSubmit={handleCreateMojiBunpou}
                    />
                  )}
                </Card>
              </TabsContent>
            );
          })
        )}

        <TabsContent value="LISTENING" className="mt-0">
          <Card className="border-border p-4">
            <div className="mb-4 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <Label>Audio Choukai paket (1 file master)</Label>
              <p className="text-xs text-muted-foreground">
                Satu pita untuk seluruh mondai. Siswa mendengar kontinu; tidak perlu intro per-mondai.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingPackageAudio || isPending || locked}
                  onClick={() => packageAudioRef.current?.click()}
                >
                  {uploadingPackageAudio ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {packageHasMasterAudio ? 'Ganti audio' : 'Unggah audio'}
                </Button>
                {packageHasMasterAudio ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isPending || locked || uploadingPackageAudio}
                    onClick={handleClearPackageChokaiAudio}
                  >
                    Hapus
                  </Button>
                ) : null}
                <input
                  ref={packageAudioRef}
                  type="file"
                  accept=".mp3,audio/mpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void uploadPackageChokaiAudio(f);
                    e.target.value = '';
                  }}
                />
              </div>
              {detail.chokaiAudioUrl ? (
                <div className="space-y-1">
                  {detail.chokaiAudioOriginalName ? (
                    <p className="text-xs text-muted-foreground">{detail.chokaiAudioOriginalName}</p>
                  ) : null}
                  <audio controls preload="none" className="w-full" src={detail.chokaiAudioUrl}>
                    <track kind="captions" />
                  </audio>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Belum ada audio master — unggah satu file untuk seluruh bagian Choukai.
                </p>
              )}
            </div>

            {mondaiList.length === 0 ? (
              <div className="space-y-3 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Belum ada grup mondai. Buat Mondai 1, lalu isi soal di dalamnya.
                </p>
                {!locked ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={handleAddMondai}
                  >
                    <Plus className="size-4" />
                    Buat Mondai 1
                  </Button>
                ) : null}
              </div>
            ) : selectedMondaiOrder != null ? (
              <Tabs
                value={String(selectedMondaiOrder)}
                onValueChange={(value) => {
                  setActiveMondaiOrder(Number.parseInt(value, 10));
                  setEditingItemId(null);
                }}
                className="gap-3"
              >
                <div className="flex flex-wrap items-end gap-2">
                  <DndContext
                    sensors={mondaiSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleMondaiDragEnd}
                  >
                    <SortableContext
                      items={mondaiList.map((g) => String(g.order))}
                      strategy={horizontalListSortingStrategy}
                    >
                      <TabsList variant="line" className="h-auto min-w-0 flex-1 flex-wrap justify-start gap-4">
                        {mondaiList.map((group, index) => (
                          <SortableMondaiTabTrigger
                            key={group.order}
                            id={String(group.order)}
                            label={`MONDAI ${index + 1}`}
                            count={group.soalCount}
                            disabled={locked || isPending}
                          />
                        ))}
                      </TabsList>
                    </SortableContext>
                  </DndContext>
                  {!locked ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mb-2 shrink-0"
                      disabled={isPending}
                      onClick={handleAddMondai}
                    >
                      <Plus className="size-4" />
                      Tambah Mondai
                    </Button>
                  ) : null}
                </div>

                {mondaiList.map((group, index) => (
                  <TabsContent key={group.order} value={String(group.order)} className="mt-0 space-y-3">
                    {group.isDraft && !locked ? (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDeleteEmptyDraftMondai(group.order)}
                        >
                          <Trash2 className="size-4" />
                          Hapus grup kosong
                        </Button>
                      </div>
                    ) : null}

                    <ul className="space-y-2">
                      {group.items.length === 0 ? (
                        <li className="text-sm text-muted-foreground">
                          Belum ada soal di mondai ini. Tambah soal di bawah.
                        </li>
                      ) : (
                        group.items.map((item) => {
                          const rowLabel = item.editData
                            ? `${item.editData.code} — ${item.editData.questionText.slice(0, 60)}`
                            : item.label;
                          const isLastInMondai = group.items.length === 1;
                          return (
                            <li key={item.id} className="space-y-2">
                              <div className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
                                <span className="min-w-0 flex-1 wrap-break-word">{rowLabel}</span>
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    disabled={isPending || locked || !item.editData}
                                    onClick={() =>
                                      setEditingItemId((prev) => (prev === item.id ? null : item.id))
                                    }
                                    aria-label="Edit soal"
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    disabled={isPending || locked}
                                    onClick={() =>
                                      handleRemove(item.id, {
                                        mondaiOrder: group.order,
                                        isLastInMondai,
                                      })
                                    }
                                    aria-label="Hapus"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              </div>
                              {editingItemId === item.id && item.editData ? (
                                <ChokaiForm
                                  key={`edit-chokai-${item.id}`}
                                  level={detail.level}
                                  locked={locked}
                                  disabled={isPending}
                                  mondaiOrder={index + 1}
                                  questionSetId={detail.id}
                                  packageCode={detail.code}
                                  initial={{
                                    questionText: item.editData.questionText,
                                    explanation: item.editData.explanation,
                                    options: item.editData.options,
                                    imageUrl: item.editData.imageUrl,
                                    imageObjectKey: item.editData.imageObjectKey,
                                  }}
                                  onCancel={() => setEditingItemId(null)}
                                  onSubmit={(data) =>
                                    handleUpdateChokai(item.id, {
                                      ...data,
                                      mondaiOrder: group.order,
                                    })
                                  }
                                />
                              ) : null}
                            </li>
                          );
                        })
                      )}
                    </ul>
                    {editingItemId && group.items.some((i) => i.id === editingItemId) ? null : (
                      <ChokaiForm
                        level={detail.level}
                        locked={locked}
                        disabled={isPending}
                        mondaiOrder={group.order}
                        questionSetId={detail.id}
                        packageCode={detail.code}
                        onSubmit={(data) =>
                          handleCreateChokai({
                            ...data,
                            mondaiOrder: group.order,
                          })
                        }
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            ) : null}
          </Card>
        </TabsContent>
      </Tabs>

      <p className="mt-4 text-xs text-muted-foreground">
        Banyak soal sekaligus?{' '}
        <Link className="underline text-primary" href={ADMIN_ROUTES.tryoutPaketImport}>
          Import ZIP
        </Link>
      </p>
    </AdminPageShell>
  );
}
