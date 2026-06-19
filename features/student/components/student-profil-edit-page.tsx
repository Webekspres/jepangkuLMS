'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, Save, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { useStudentCoreData } from './student-core-data-context';
import { updateStudentAvatar, updateStudentBio, updateStudentDisplayName } from '@/features/student/actions/profile-actions';
import { STUDENT_CORE_DATA_REFRESH_EVENT } from '@/features/student/lib/student-core-data-events';
import { STUDENT_ROUTES } from './student-routes';

export function StudentProfilEditPage() {
  const router = useRouter();
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();

  const avatarUrl = core.avatarUrl ?? identity?.imageUrl;
  const initialDisplayName = core.displayName ?? identity?.displayName ?? '';
  const initialBio = core.bio ?? '';

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isAvatarPending, startAvatarTransition] = useTransition();

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    startAvatarTransition(async () => {
      try {
        const { optimizeImageFileForUpload } = await import('@/lib/media/optimize-image-client');
        const optimized = await optimizeImageFileForUpload(file, {
          maxWidth: 512,
          maxHeight: 512,
        });
        const formData = new FormData();
        formData.set('avatar', optimized.file);
        const result = await updateStudentAvatar(formData);
        if (!result.ok) {
          setAvatarError(result.error);
          toast.error(result.error);
          return;
        }
        toast.success('Foto profil diperbarui.');
        window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
        router.refresh();
      } catch {
        setAvatarError('Gagal memproses foto.');
        toast.error('Gagal memproses foto.');
      }
    });
  }

  function handleSave() {
    setDisplayNameError(null);
    setDisplayNameSaved(false);
    startTransition(async () => {
      const nameResult = await updateStudentDisplayName(displayName);
      if (!nameResult.ok) {
        setDisplayNameError(nameResult.error);
        toast.error(nameResult.error);
        return;
      }

      const bioResult = await updateStudentBio(bio);
      if (!bioResult.ok) {
        setDisplayNameError(bioResult.error);
        toast.error(bioResult.error);
        return;
      }

      setDisplayNameSaved(true);
      toast.success('Profil berhasil disimpan.');
      window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Back link */}
      <Link
        href={STUDENT_ROUTES.profil}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Kembali ke Profil
      </Link>

      {/* Page header */}
      <div>
        <p className="mb-0.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">PROFIL</p>
        <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Edit Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola nama tampilan dan informasi profil belajar kamu.
        </p>
      </div>

      {/* ── Foto profil ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Foto Profil
        </p>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt=""
                width={80}
                height={80}
                className="size-20 rounded-2xl border-2 border-border object-cover"
              />
            ) : (
              <div className="flex size-20 items-center justify-center rounded-2xl border-2 border-border bg-primary/10 text-3xl font-black text-primary">
                {displayName.charAt(0).toUpperCase() || <User className="size-8" />}
              </div>
            )}
            <label className="absolute -right-1 -bottom-1 flex size-7 cursor-pointer items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm hover:bg-primary hover:text-primary-foreground">
              <Camera className="size-3.5" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={isAvatarPending}
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Unggah foto JPG, PNG, atau WebP (maks. 2 MB). Disimpan di LMS/R2.
            </p>
            {avatarError ? <p className="mt-2 text-xs text-destructive">{avatarError}</p> : null}
            {isAvatarPending ? (
              <p className="mt-2 text-xs text-muted-foreground">Mengunggah foto…</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Foto Clerk tetap dipakai jika belum upload foto LMS.
            </p>
          </div>
        </div>
      </section>

      {/* ── Informasi dasar ───────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="mb-5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Informasi Dasar
        </p>
        <div className="space-y-5 max-w-md">
          {/* Display name */}
          <div className="space-y-2">
            <Label htmlFor="display-name">
              Nama Tampilan <span className="text-destructive">*</span>
            </Label>
            <Input
              id="display-name"
              value={displayName}
              maxLength={32}
              disabled={isPending}
              onChange={(e) => {
                setDisplayName(e.target.value);
                setDisplayNameSaved(false);
                setDisplayNameError(null);
              }}
              placeholder="Contoh: Kenji"
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground">
              Huruf, angka, dan underscore. 2–32 karakter.
              {displayName.length > 0 && (
                <span className={cn('ml-2', displayName.length > 30 ? 'text-destructive' : '')}>
                  {displayName.length}/32
                </span>
              )}
            </p>
            {displayNameError && (
              <p className="text-xs text-destructive">{displayNameError}</p>
            )}
            {displayNameSaved && (
              <p className="text-xs font-semibold text-emerald-600">✓ Nama berhasil diperbarui</p>
            )}
          </div>

          {/* Email (readonly from Clerk) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={identity?.email ?? core.email ?? ''}
              disabled
              className="max-w-sm bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Email dikelola melalui akun Clerk dan tidak dapat diubah di sini.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bio ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bio</p>
          <span className="text-[10px] text-muted-foreground">{bio.length}/280</span>
        </div>
        <textarea
          value={bio}
          rows={4}
          maxLength={280}
          disabled={isPending}
          onChange={(event) => {
            setBio(event.target.value);
            setDisplayNameSaved(false);
          }}
          placeholder="Ceritakan sedikit tentang dirimu dan tujuan belajar Jepangmu..."
          className="w-full max-w-md resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Bio tampil di halaman profil publik belajarmu.
        </p>
      </section>

      {/* ── Save button ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleSave}
          disabled={isPending || displayName.trim().length < 2}
          className="gap-2"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Simpan Perubahan
        </Button>
        <Button variant="ghost" asChild>
          <Link href={STUDENT_ROUTES.profil}>Batal</Link>
        </Button>
      </div>
    </div>
  );
}
