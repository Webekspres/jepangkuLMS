'use client';

import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Loader2, Save, User } from 'lucide-react';
import Cropper, { type Area } from 'react-easy-crop';
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

  // Image Crop states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string>('avatar.jpg');

  // Local crop preview file states
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  // cleanup object URL to avoid memory leak
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarError(null);
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setIsCropModalOpen(true);
      setZoom(1);
      setRotation(0);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);

    // Reset input so selecting same image triggers change again
    event.target.value = '';
  }

  async function handleApplyCrop() {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsCropModalOpen(false);

    try {
      const { getCroppedImg } = await import('@/features/student/lib/crop-image');
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (!croppedBlob) {
        setAvatarError('Gagal memotong foto.');
        return;
      }

      const croppedFile = new File([croppedBlob], selectedFileName, {
        type: 'image/jpeg',
      });

      setPendingAvatarFile(croppedFile);

      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      const preview = URL.createObjectURL(croppedBlob);
      setAvatarPreviewUrl(preview);
      setAvatarError(null);
    } catch (error) {
      setAvatarError('Gagal memproses potong foto.');
      toast.error('Gagal memproses potong foto.');
    }
  }

  function handleSave() {
    setDisplayNameError(null);
    setDisplayNameSaved(false);
    setAvatarError(null);

    startTransition(async () => {
      try {
        // 1. If there's a pending avatar file, upload it first
        if (pendingAvatarFile) {
          const { optimizeImageFileForUpload } = await import('@/lib/media/optimize-image-client');
          const optimized = await optimizeImageFileForUpload(pendingAvatarFile, {
            maxWidth: 512,
            maxHeight: 512,
          });

          const formData = new FormData();
          formData.set('avatar', optimized.file);

          const avatarResult = await updateStudentAvatar(formData);
          if (!avatarResult.ok) {
            setAvatarError(avatarResult.error);
            toast.error(avatarResult.error);
            return;
          }
        }

        // 2. Save Name and Bio
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
        setPendingAvatarFile(null); // Clear pending avatar
        toast.success('Profil berhasil disimpan.');
        window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
        router.refresh();
      } catch (error) {
        setDisplayNameError('Terjadi kesalahan saat menyimpan profil.');
        toast.error('Terjadi kesalahan saat menyimpan profil.');
      }
    });
  }

  const displayAvatarUrl = avatarPreviewUrl ?? avatarUrl;

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
            {displayAvatarUrl ? (
              <Image
                src={displayAvatarUrl}
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
                disabled={isPending}
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Ubah foto profile kamu!
            </p>
            {avatarError ? <p className="mt-2 text-xs text-destructive">{avatarError}</p> : null}
            {isPending && pendingAvatarFile ? (
              <p className="mt-2 text-xs text-muted-foreground animate-pulse">Mengunggah foto…</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              format yang didukung: JPG, PNG, WebP (max 2MB)
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
          {/* <div className="space-y-2">
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
          </div> */}
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

      {/* ── Modal Potong Foto (react-easy-crop) ────────────────────────────────── */}
      {isCropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative flex w-full max-w-lg flex-col rounded-3xl border border-brand-yellow/30 bg-slate-950 p-5 shadow-2xl text-white">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Camera className="size-5 text-brand-yellow" />
                Sesuaikan Foto Profil
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Geser, perbesar, dan putar gambar agar pas di dalam lingkaran.
              </p>
            </div>

            {/* Cropper Container */}
            <div className="relative w-full h-64 sm:h-80 bg-black rounded-2xl overflow-hidden border border-white/10">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>

            {/* Controls */}
            <div className="mt-4 space-y-4">
              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Perbesar (Zoom)</span>
                  <span>{zoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                />
              </div>

              {/* Rotation Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>Putar (Rotation)</span>
                  <span>{rotation}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-yellow"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3 border-t border-white/10 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCropModalOpen(false);
                  setImageSrc(null);
                }}
                className="text-slate-300 hover:text-white hover:bg-white/5"
              >
                Batal
              </Button>
              <Button
                onClick={handleApplyCrop}
                className="bg-brand-yellow text-slate-950 font-bold hover:bg-brand-yellow/90 border border-transparent"
              >
                Terapkan Foto
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
