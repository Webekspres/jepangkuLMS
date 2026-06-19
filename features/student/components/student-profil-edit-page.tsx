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
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import { useStudentCoreData } from './student-core-data-context';
import { updateStudentDisplayName } from '@/features/student/actions/profile-actions';
import { STUDENT_ROUTES } from './student-routes';

export function StudentProfilEditPage() {
  const router = useRouter();
  const { identity } = useClerkIdentity();
  const core = useStudentCoreData();

  const avatarUrl = identity?.imageUrl ?? core.avatarUrl;
  const initialDisplayName = core.displayName ?? identity?.displayName ?? '';

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setDisplayNameError(null);
    setDisplayNameSaved(false);
    startTransition(async () => {
      const result = await updateStudentDisplayName(displayName);
      if (!result.ok) {
        setDisplayNameError(result.error);
        return;
      }
      setDisplayNameSaved(true);
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
            <div className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-muted-foreground shadow-sm">
              <Camera className="size-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Unggah foto JPG, PNG, atau WebP. Akan di-crop persegi 400×400px sebelum diunggah.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Foto profil dikelola melalui akun Clerk kamu.{' '}
              <a
                href="https://accounts.clerk.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Buka pengaturan akun →
              </a>
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

      {/* ── Bio (placeholder) ──────────────────────────────────────────── */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 opacity-60">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bio</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Segera hadir
          </span>
        </div>
        <textarea
          disabled
          rows={4}
          placeholder="Ceritakan sedikit tentang dirimu dan tujuan belajar Jepangmu... (fitur akan hadir segera)"
          className="w-full max-w-md resize-none rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
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
