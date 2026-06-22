'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { AdminConfirmDialog } from '@/features/admin-cms/components/admin-confirm-dialog';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import { AdminTablePagination } from '@/features/admin-cms/components/admin-table-pagination';
import { updateLessonAction } from '@/features/admin-cms/actions/cms-lesson-actions';
import {
  createKanjiMaterialAction,
  createKosakataMaterialAction,
  createTataBahasaMaterialAction,
  deleteKanjiMaterialAction,
  deleteKosakataMaterialAction,
  deleteTataBahasaMaterialAction,
  updateKanjiMaterialAction,
  updateKosakataMaterialAction,
  updateTataBahasaMaterialAction,
} from '@/features/admin-cms/actions/cms-material-actions';
import {
  createLessonQuestionAction,
  deleteLessonQuestionAction,
  updateLessonQuestionAction,
} from '@/features/admin-cms/actions/cms-question-actions';
import type { AdminLessonContent } from '@/features/admin-cms/lib/load-admin-lesson-content';
import { useAdminTablePagination } from '@/features/admin-cms/hooks/use-admin-table-pagination';
import { AdminAdvancedSlugField } from '@/features/admin-cms/components/admin-advanced-slug-field';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type Scope = {
  courseId: string;
  moduleId: string;
  lessonId: string;
};

type AdminLessonWorkspaceProps = {
  scope: Scope;
  moduleTitle: string;
  courseSlug: string;
  content: AdminLessonContent;
};

type MainTab = 'info' | 'flashcard' | 'quiz';
type FlashTab = 'kosakata' | 'kanji' | 'tata-bahasa';

function StatusBanner({ message, tone }: { message: string; tone: 'success' | 'error' }) {
  return (
    <p
      className={cn(
        'rounded-lg border px-4 py-2 text-sm',
        tone === 'success'
          ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700'
          : 'border-destructive/30 bg-destructive/5 text-destructive',
      )}
    >
      {message}
    </p>
  );
}

export function AdminLessonWorkspace({ scope, moduleTitle, courseSlug, content }: AdminLessonWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as MainTab | null) ?? 'info';
  const [mainTab, setMainTab] = useState<MainTab>(
    initialTab === 'flashcard' || initialTab === 'quiz' ? initialTab : 'info',
  );
  const [flashTab, setFlashTab] = useState<FlashTab>('kosakata');
  const [banner, setBanner] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const materialTotal = useMemo(
    () => content.kosakatas.length + content.kanjis.length + content.tataBahasas.length,
    [content],
  );

  return (
    <AdminPageShell
      label={moduleTitle}
      title={content.lesson.title}
      subtitle="Kelola video, flashcard, dan kuis untuk pelajaran ini — materi yang siswa lihat di halaman belajar."
      backHref={ADMIN_ROUTES.kursusLessons(scope.courseId, scope.moduleId)}
      action={
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/dashboard/belajar/${courseSlug}/${content.lesson.slug}`}
            target="_blank"
          >
            Preview siswa
          </Link>
        </Button>
      }
    >
      {banner ? <div className="mb-4"><StatusBanner {...banner} /></div> : null}

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="gap-6">
        <TabsList>
          <TabsTrigger value="info">Informasi</TabsTrigger>
          <TabsTrigger value="flashcard">
            Flashcard
            {materialTotal > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {materialTotal}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="quiz">
            Kuis
            {content.questions.length > 0 ? (
              <Badge variant="secondary" className="ml-2">
                {content.questions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <LessonInfoPanel
            scope={scope}
            lesson={content.lesson}
            onSaved={(message) => {
              setBanner({ message, tone: 'success' });
              router.refresh();
            }}
            onError={(message) => setBanner({ message, tone: 'error' })}
          />
        </TabsContent>

        <TabsContent value="flashcard">
          <p className="mb-4 text-sm text-muted-foreground">
            Kelola kartu per jenis materi. Di halaman belajar siswa, semua jenis digabung jadi satu
            deck flashcard (diacak setiap sesi).
          </p>
          <Tabs value={flashTab} onValueChange={(v) => setFlashTab(v as FlashTab)}>
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="kosakata">Kosakata ({content.kosakatas.length})</TabsTrigger>
              <TabsTrigger value="kanji">Kanji ({content.kanjis.length})</TabsTrigger>
              <TabsTrigger value="tata-bahasa">
                Tata Bahasa ({content.tataBahasas.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kosakata">
              <KosakataPanel
                scope={scope}
                items={content.kosakatas}
                onChange={(message, tone) => {
                  setBanner({ message, tone });
                  router.refresh();
                }}
              />
            </TabsContent>
            <TabsContent value="kanji">
              <KanjiPanel
                scope={scope}
                items={content.kanjis}
                onChange={(message, tone) => {
                  setBanner({ message, tone });
                  router.refresh();
                }}
              />
            </TabsContent>
            <TabsContent value="tata-bahasa">
              <TataBahasaPanel
                scope={scope}
                items={content.tataBahasas}
                onChange={(message, tone) => {
                  setBanner({ message, tone });
                  router.refresh();
                }}
              />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="quiz">
          <QuizPanel
            scope={scope}
            questions={content.questions}
            onChange={(message, tone) => {
              setBanner({ message, tone });
              router.refresh();
            }}
          />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}

function LessonInfoPanel({
  scope,
  lesson,
  onSaved,
  onError,
}: {
  scope: Scope;
  lesson: AdminLessonContent['lesson'];
  onSaved: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    title: lesson.title,
    slug: lesson.slug,
    order: lesson.order,
    content: lesson.content ?? '',
    videoUrl: lesson.videoUrl ?? '',
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set('courseId', scope.courseId);
    formData.set('moduleId', scope.moduleId);
    formData.set('title', values.title);
    formData.set('slug', values.slug);
    formData.set('order', String(values.order));
    formData.set('content', values.content);
    formData.set('videoUrl', values.videoUrl);

    startTransition(async () => {
      const result = await updateLessonAction(lesson.id, formData);
      if (!result.ok) {
        onError(result.message ?? 'Gagal menyimpan pelajaran.');
        return;
      }
      onSaved('Informasi pelajaran disimpan.');
    });
  };

  return (
    <Card className="max-w-3xl border-border">
      <CardHeader className="border-b border-border bg-muted/30">
        <CardTitle className="text-base font-bold">Informasi Pelajaran</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Pelajaran</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => setValues((p) => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Urutan</Label>
            <Input
              id="order"
              type="number"
              min={1}
              value={values.order}
              onChange={(e) => setValues((p) => ({ ...p, order: Number(e.target.value) }))}
              required
            />
          </div>
          <AdminAdvancedSlugField
            id="slug"
            slug={values.slug}
            onSlugChange={(slug) => setValues((p) => ({ ...p, slug }))}
          />
          <div className="space-y-2">
            <Label htmlFor="videoUrl">URL Video</Label>
            <Input
              id="videoUrl"
              value={values.videoUrl}
              onChange={(e) => setValues((p) => ({ ...p, videoUrl: e.target.value }))}
              placeholder="https://youtube.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Catatan / intro</Label>
            <Textarea
              id="content"
              value={values.content}
              onChange={(e) => setValues((p) => ({ ...p, content: e.target.value }))}
              rows={4}
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Simpan Informasi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function KosakataPanel({
  scope,
  items,
  onChange,
}: {
  scope: Scope;
  items: AdminLessonContent['kosakatas'];
  onChange: (message: string, tone: 'success' | 'error') => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    kosakata: '',
    furigana: '',
    romaji: '',
    arti: '',
    contohKalimat: '',
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({ kosakata: '', furigana: '', romaji: '', arti: '', contohKalimat: '' });
  };

  const payload = () => ({ ...scope, ...form });

  const {
    paginatedItems: paginatedKosakata,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(items);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = editingId
        ? await updateKosakataMaterialAction(editingId, payload())
        : await createKosakataMaterialAction(payload());
      if (!result.ok) {
        onChange(result.message ?? 'Gagal menyimpan kosakata.', 'error');
        return;
      }
      onChange(editingId ? 'Kosakata diperbarui.' : 'Kosakata ditambahkan.', 'success');
      resetForm();
    });
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kosakata</TableHead>
              <TableHead>Furigana</TableHead>
              <TableHead>Arti</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totalItems === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Belum ada flashcard kosakata untuk pelajaran ini.
                </TableCell>
              </TableRow>
            ) : (
              paginatedKosakata.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.kosakata}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[item.furigana, item.romaji].filter(Boolean).join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm">{item.arti}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            kosakata: item.kosakata,
                            furigana: item.furigana ?? '',
                            romaji: item.romaji ?? '',
                            arti: item.arti,
                            contohKalimat: item.contohKalimat ?? '',
                          });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <AdminTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="kosakata"
        />
      </Card>

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold">
            {editingId ? 'Edit Kosakata' : 'Tambah Kosakata'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Kosakata *</Label>
              <Input
                value={form.kosakata}
                onChange={(e) => setForm((p) => ({ ...p, kosakata: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Furigana</Label>
              <Input
                value={form.furigana}
                onChange={(e) => setForm((p) => ({ ...p, furigana: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Romaji</Label>
              <Input
                value={form.romaji}
                onChange={(e) => setForm((p) => ({ ...p, romaji: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Arti *</Label>
              <Input
                value={form.arti}
                onChange={(e) => setForm((p) => ({ ...p, arti: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Contoh kalimat</Label>
              <Textarea
                value={form.contohKalimat}
                onChange={(e) => setForm((p) => ({ ...p, contohKalimat: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={isPending}>
                <Plus className="size-4" />
                {editingId ? 'Simpan Perubahan' : 'Tambah'}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus kosakata?"
        description="Flashcard ini akan dihapus dari pelajaran ini."
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            const result = await deleteKosakataMaterialAction(
              scope.courseId,
              scope.moduleId,
              scope.lessonId,
              deleteId,
            );
            setDeleteId(null);
            onChange(
              result.ok ? 'Kosakata dihapus.' : (result.message ?? 'Gagal menghapus.'),
              result.ok ? 'success' : 'error',
            );
          });
        }}
      />
    </div>
  );
}

function KanjiPanel({
  scope,
  items,
  onChange,
}: {
  scope: Scope;
  items: AdminLessonContent['kanjis'];
  onChange: (message: string, tone: 'success' | 'error') => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    huruf: '',
    furigana: '',
    romaji: '',
    arti: '',
    onyomi: '',
    kunyomi: '',
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({ huruf: '', furigana: '', romaji: '', arti: '', onyomi: '', kunyomi: '' });
  };

  const payload = () => ({ ...scope, ...form });

  const {
    paginatedItems: paginatedKanji,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(items);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kanji</TableHead>
              <TableHead>Bacaan</TableHead>
              <TableHead>Arti</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totalItems === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Belum ada flashcard kanji untuk pelajaran ini.
                </TableCell>
              </TableRow>
            ) : (
              paginatedKanji.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-lg font-medium">{item.huruf}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {[item.furigana, item.onyomi, item.kunyomi].filter(Boolean).join(' · ') || '—'}
                  </TableCell>
                  <TableCell className="text-sm">{item.arti}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            huruf: item.huruf,
                            furigana: item.furigana ?? '',
                            romaji: item.romaji ?? '',
                            arti: item.arti,
                            onyomi: item.onyomi ?? '',
                            kunyomi: item.kunyomi ?? '',
                          });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <AdminTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="kanji"
        />
      </Card>

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold">
            {editingId ? 'Edit Kanji' : 'Tambah Kanji'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = editingId
                  ? await updateKanjiMaterialAction(editingId, payload())
                  : await createKanjiMaterialAction(payload());
                if (!result.ok) {
                  onChange(result.message ?? 'Gagal menyimpan kanji.', 'error');
                  return;
                }
                onChange(editingId ? 'Kanji diperbarui.' : 'Kanji ditambahkan.', 'success');
                resetForm();
              });
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2">
              <Label>Kanji *</Label>
              <Input
                value={form.huruf}
                onChange={(e) => setForm((p) => ({ ...p, huruf: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Arti *</Label>
              <Input
                value={form.arti}
                onChange={(e) => setForm((p) => ({ ...p, arti: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Furigana</Label>
              <Input
                value={form.furigana}
                onChange={(e) => setForm((p) => ({ ...p, furigana: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Romaji</Label>
              <Input
                value={form.romaji}
                onChange={(e) => setForm((p) => ({ ...p, romaji: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Onyomi</Label>
              <Input
                value={form.onyomi}
                onChange={(e) => setForm((p) => ({ ...p, onyomi: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Kunyomi</Label>
              <Input
                value={form.kunyomi}
                onChange={(e) => setForm((p) => ({ ...p, kunyomi: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={isPending}>
                {editingId ? 'Simpan Perubahan' : 'Tambah Kanji'}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus kanji?"
        description="Flashcard kanji ini akan dihapus dari pelajaran ini."
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            const result = await deleteKanjiMaterialAction(
              scope.courseId,
              scope.moduleId,
              scope.lessonId,
              deleteId,
            );
            setDeleteId(null);
            onChange(
              result.ok ? 'Kanji dihapus.' : (result.message ?? 'Gagal menghapus.'),
              result.ok ? 'success' : 'error',
            );
          });
        }}
      />
    </div>
  );
}

function TataBahasaPanel({
  scope,
  items,
  onChange,
}: {
  scope: Scope;
  items: AdminLessonContent['tataBahasas'];
  onChange: (message: string, tone: 'success' | 'error') => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ tataBahasa: '', arti: '', contohKalimat: '' });

  const resetForm = () => {
    setEditingId(null);
    setForm({ tataBahasa: '', arti: '', contohKalimat: '' });
  };

  const payload = () => ({ ...scope, ...form });

  const {
    paginatedItems: paginatedTataBahasa,
    page,
    pageSize,
    totalItems,
    setPage,
    setPageSize,
  } = useAdminTablePagination(items);

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pola</TableHead>
              <TableHead>Arti</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totalItems === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Belum ada materi tata bahasa untuk pelajaran ini.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTataBahasa.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.tataBahasa}</TableCell>
                  <TableCell className="text-sm">{item.arti}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            tataBahasa: item.tataBahasa,
                            arti: item.arti,
                            contohKalimat: item.contohKalimat ?? '',
                          });
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <AdminTablePagination
          page={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemLabel="tata bahasa"
        />
      </Card>

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold">
            {editingId ? 'Edit Tata Bahasa' : 'Tambah Tata Bahasa'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = editingId
                  ? await updateTataBahasaMaterialAction(editingId, payload())
                  : await createTataBahasaMaterialAction(payload());
                if (!result.ok) {
                  onChange(result.message ?? 'Gagal menyimpan tata bahasa.', 'error');
                  return;
                }
                onChange(
                  editingId ? 'Tata bahasa diperbarui.' : 'Tata bahasa ditambahkan.',
                  'success',
                );
                resetForm();
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Pola / tata bahasa *</Label>
              <Input
                value={form.tataBahasa}
                onChange={(e) => setForm((p) => ({ ...p, tataBahasa: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Arti *</Label>
              <Input
                value={form.arti}
                onChange={(e) => setForm((p) => ({ ...p, arti: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Contoh kalimat</Label>
              <Textarea
                value={form.contohKalimat}
                onChange={(e) => setForm((p) => ({ ...p, contohKalimat: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {editingId ? 'Simpan Perubahan' : 'Tambah'}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus tata bahasa?"
        description="Materi ini akan dihapus dari pelajaran ini."
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            const result = await deleteTataBahasaMaterialAction(
              scope.courseId,
              scope.moduleId,
              scope.lessonId,
              deleteId,
            );
            setDeleteId(null);
            onChange(
              result.ok ? 'Tata bahasa dihapus.' : (result.message ?? 'Gagal menghapus.'),
              result.ok ? 'success' : 'error',
            );
          });
        }}
      />
    </div>
  );
}

function QuizPanel({
  scope,
  questions,
  onChange,
}: {
  scope: Scope;
  questions: AdminLessonContent['questions'];
  onChange: (message: string, tone: 'success' | 'error') => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const emptyOptions = () => [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ];
  const [form, setForm] = useState({
    questionText: '',
    explanation: '',
    xpReward: 10,
    options: emptyOptions(),
    correctIndex: '0',
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      questionText: '',
      explanation: '',
      xpReward: 10,
      options: emptyOptions(),
      correctIndex: '0',
    });
  };

  const buildPayload = () => ({
    ...scope,
    questionText: form.questionText,
    explanation: form.explanation,
    xpReward: form.xpReward,
    options: form.options.map((opt, index) => ({
      text: opt.text,
      isCorrect: String(index) === form.correctIndex,
    })),
  });

  return (
    <div className="space-y-6">
      {questions.map((question, index) => (
        <Card key={question.id} className="border-border">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border bg-muted/20 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Soal {index + 1}
              </p>
              <CardTitle className="mt-1 text-base font-semibold leading-snug">
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
                  setForm({
                    questionText: question.questionText,
                    explanation: question.explanation ?? '',
                    xpReward: question.xpReward,
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
          <CardContent className="pt-4">
            <ul className="space-y-1 text-sm">
              {question.options.map((opt) => (
                <li
                  key={opt.id}
                  className={cn(
                    'rounded-md px-2 py-1',
                    opt.isCorrect && 'bg-emerald-500/10 font-medium text-emerald-700',
                  )}
                >
                  {opt.text}
                  {opt.isCorrect ? ' ✓' : ''}
                </li>
              ))}
            </ul>
            {question.explanation ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Penjelasan: {question.explanation}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ))}

      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada soal kuis untuk pelajaran ini. Siswa tidak akan melihat tab Quiz sampai ada
          minimal 1 soal.
        </p>
      ) : null}

      <Card className="border-border">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base font-bold">
            {editingId ? 'Edit Soal' : 'Tambah Soal Kuis'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const payload = buildPayload();
                const result = editingId
                  ? await updateLessonQuestionAction(editingId, payload)
                  : await createLessonQuestionAction(payload);
                if (!result.ok) {
                  onChange(result.message ?? 'Gagal menyimpan soal.', 'error');
                  return;
                }
                onChange(editingId ? 'Soal diperbarui.' : 'Soal ditambahkan.', 'success');
                resetForm();
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Pertanyaan *</Label>
              <Textarea
                value={form.questionText}
                onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Penjelasan (setelah jawaban)</Label>
              <Textarea
                value={form.explanation}
                onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2 max-w-xs">
              <Label>XP reward</Label>
              <Input
                type="number"
                min={1}
                max={1000}
                value={form.xpReward}
                onChange={(e) => setForm((p) => ({ ...p, xpReward: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Opsi jawaban — pilih yang benar</Label>
              <RadioGroup
                value={form.correctIndex}
                onValueChange={(value) => setForm((p) => ({ ...p, correctIndex: value }))}
              >
                {form.options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <RadioGroupItem value={String(index)} id={`opt-${index}`} />
                    <Input
                      value={opt.text}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          options: p.options.map((o, i) =>
                            i === index ? { ...o, text: e.target.value } : o,
                          ),
                        }))
                      }
                      placeholder={`Opsi ${index + 1}`}
                      required
                    />
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {editingId ? 'Simpan Soal' : 'Tambah Soal'}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal Edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <AdminConfirmDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Hapus soal?"
        description="Soal ini akan dihapus dari kuis pelajaran ini."
        loading={isPending}
        onConfirm={() => {
          if (!deleteId) return;
          startTransition(async () => {
            const result = await deleteLessonQuestionAction(
              scope.courseId,
              scope.moduleId,
              scope.lessonId,
              deleteId,
            );
            setDeleteId(null);
            onChange(
              result.ok ? 'Soal dihapus.' : (result.message ?? 'Gagal menghapus.'),
              result.ok ? 'success' : 'error',
            );
          });
        }}
      />
    </div>
  );
}
