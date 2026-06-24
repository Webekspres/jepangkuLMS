'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AdminPageShell } from '@/features/admin-cms/components/admin-page-shell';
import {
  createBadgeAction,
  updateBadgeAction,
} from '@/features/admin-cms/actions/cms-badge-actions';
import { ADMIN_ROUTES } from '@/lib/auth/constants';
import { optimizeImageFileForUpload } from '@/lib/media/optimize-image-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { LMS_BADGE_RARITY_OPTIONS } from '@/lib/lms/badge-rarity';

type BadgeFormData = {
  id?: string;
  code: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  rarity: string;
  unlockRule: string;
  unlockValue: number | null;
  xpBonus: number;
  requirementText: string | null;
};

export function AdminBadgeFormPage({
  badge,
  r2Configured,
}: {
  badge?: BadgeFormData;
  r2Configured: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [unlockRule, setUnlockRule] = useState(badge?.unlockRule ?? 'MANUAL');
  const [rarity, setRarity] = useState(badge?.rarity ?? 'COMMON');
  const [imagePreview, setImagePreview] = useState<string | null>(
    badge?.imageUrl && !removeImage ? badge.imageUrl : null,
  );
  const [imageOptimizing, setImageOptimizing] = useState(false);
  const [imageHint, setImageHint] = useState<string | null>(null);
  const [hasNewImage, setHasNewImage] = useState(false);
  const optimizedFileRef = useRef<File | null>(null);
  const previewBlobRef = useRef<string | null>(null);
  const isEdit = Boolean(badge?.id);
  const r2Ready = r2Configured;

  useEffect(() => {
    return () => {
      if (previewBlobRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewBlobRef.current);
      }
    };
  }, []);

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImageOptimizing(true);
    setImageHint(null);
    setRemoveImage(false);

    try {
      const optimized = await optimizeImageFileForUpload(file, {
        maxWidth: 512,
        maxHeight: 512,
      });
      optimizedFileRef.current = optimized.file;
      setHasNewImage(true);

      if (previewBlobRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewBlobRef.current);
      }
      previewBlobRef.current = optimized.previewUrl;
      setImagePreview(optimized.previewUrl);

      const savedPct =
        optimized.originalSize > optimized.optimizedSize
          ? Math.round((1 - optimized.optimizedSize / optimized.originalSize) * 100)
          : 0;
      setImageHint(
        savedPct > 0
          ? `Dioptimalkan ke WebP (${Math.round(optimized.optimizedSize / 1024)} KB, −${savedPct}%).`
          : `Siap diunggah (${Math.round(optimized.optimizedSize / 1024)} KB).`,
      );
    } catch {
      setError('Gagal memproses gambar. Coba file lain.');
      optimizedFileRef.current = null;
      setHasNewImage(false);
    } finally {
      setImageOptimizing(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (removeImage) formData.set('removeImage', 'true');
    if (optimizedFileRef.current) {
      formData.set('image', optimizedFileRef.current);
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateBadgeAction(badge!.id!, formData)
        : await createBadgeAction(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push(ADMIN_ROUTES.badges);
      router.refresh();
    });
  }

  return (
    <AdminPageShell
      label="Gamifikasi"
      title={isEdit ? 'Edit Badge' : 'Badge Baru'}
      subtitle="Upload ke R2 jika dikonfigurasi; jika tidak, gambar disimpan ke public/badges (lokal/VPS). Atau pakai URL statis /badges/…"
      action={
        <Button asChild variant="outline">
          <Link href={ADMIN_ROUTES.badges}>
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
      }
    >
      {!r2Ready ? (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          R2 belum dikonfigurasi atau token tidak punya izin tulis — upload gambar akan disimpan ke{' '}
          <code className="text-foreground">public/badges/</code> (cocok untuk dev/VPS). Untuk production
          dengan CDN, perbaiki env R2 atau gunakan field URL statis di bawah.
        </Card>
      ) : null}

      <Card className="max-w-xl border-border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="unlockRule" value={unlockRule} />
          <input type="hidden" name="rarity" value={rarity} />
          <div className="space-y-2">
            <Label htmlFor="title">Judul</Label>
            <Input id="title" name="title" defaultValue={badge?.title ?? ''} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Kode (slug)</Label>
            <Input
              id="code"
              name="code"
              defaultValue={badge?.code ?? ''}
              placeholder="first-lesson"
              disabled={isEdit}
              required={!isEdit}
            />
            {isEdit ? (
              <p className="text-xs text-muted-foreground">Kode tidak bisa diubah setelah dibuat.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={badge?.description ?? ''} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rarity">Rarity</Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger id="rarity">
                  <SelectValue placeholder="Pilih rarity" />
                </SelectTrigger>
                <SelectContent>
                  {LMS_BADGE_RARITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Common (abu), Rare (biru), Epic (ungu), Legendary (emas).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Urutan tampil</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={badge?.sortOrder ?? 0}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unlockRule">Aturan unlock</Label>
              <Select value={unlockRule} onValueChange={setUnlockRule}>
                <SelectTrigger id="unlockRule">
                  <SelectValue placeholder="Pilih aturan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual (admin grant)</SelectItem>
                  <SelectItem value="FIRST_LESSON">Lesson pertama selesai</SelectItem>
                  <SelectItem value="FIRST_QUIZ">Quiz pertama selesai</SelectItem>
                  <SelectItem value="TRYOUT_PASS">Tryout lulus</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Otomatis saat siswa memicu event belajar yang sesuai.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unlockValue">Nilai unlock (opsional)</Label>
              <Input
                id="unlockValue"
                name="unlockValue"
                type="number"
                min={0}
                placeholder="60 untuk skor tryout min."
                defaultValue={badge?.unlockValue ?? ''}
              />
              <p className="text-xs text-muted-foreground">
                Hanya untuk TRYOUT_PASS — skor minimum (%).
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="xpBonus">Bonus XP saat unlock</Label>
              <Input
                id="xpBonus"
                name="xpBonus"
                type="number"
                min={0}
                defaultValue={badge?.xpBonus ?? 25}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirementText">Teks syarat (tampilan siswa)</Label>
              <Input
                id="requirementText"
                name="requirementText"
                placeholder="Selesaikan lesson pertamamu"
                defaultValue={badge?.requirementText ?? ''}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL gambar statis (opsional)</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              placeholder="/badges/Word Rookie.png"
              defaultValue={
                badge?.imageUrl?.startsWith('/badges/') ? badge.imageUrl : ''
              }
            />
            <p className="text-xs text-muted-foreground">
              Pakai file di <code>public/badges/</code> tanpa upload — mis. hasil seed awal.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Gambar badge (upload)</Label>
            {badge?.imageUrl && !removeImage && !hasNewImage ? (
              <div className="mb-2 flex items-center gap-3">
                <Image
                  src={badge.imageUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="size-16 rounded-xl object-cover"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRemoveImage(true);
                    setImagePreview(null);
                    setImageHint(null);
                    optimizedFileRef.current = null;
                    setHasNewImage(false);
                  }}
                >
                  Hapus gambar
                </Button>
              </div>
            ) : null}
            {imagePreview ? (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <Image
                  src={imagePreview}
                  alt="Pratinjau badge"
                  width={80}
                  height={80}
                  unoptimized
                  className="size-20 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1 text-sm text-muted-foreground">
                  {imageOptimizing ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Mengoptimalkan gambar…
                    </span>
                  ) : (
                    imageHint ?? 'Pratinjau gambar yang akan diunggah.'
                  )}
                </div>
              </div>
            ) : null}
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              disabled={imageOptimizing || isPending}
            />
            <p className="text-xs text-muted-foreground">
              Upload PNG/JPEG/WebP (maks. 2 MB). R2 jika tersedia; jika gagal, disimpan ke public/badges.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Buat Badge'}
          </Button>
        </form>
      </Card>
    </AdminPageShell>
  );
}
