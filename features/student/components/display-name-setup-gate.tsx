'use client';

import { useState, useTransition } from 'react';
import { Loader2, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useClerkIdentity } from '@/features/auth/hooks/use-clerk-identity';
import {
  completeStudentDisplayNameSetup,
  completeStudentPhoneSetup,
} from '@/features/student/actions/profile-actions';
import { STUDENT_CORE_DATA_REFRESH_EVENT } from '@/features/student/lib/student-core-data-events';
import { useStudentCoreData } from '@/features/student/components/student-core-data-context';

type DisplayNameSetupFormProps = {
  suggested: string;
  onCompleted: () => void;
};

function DisplayNameSetupForm({ suggested, onCompleted }: DisplayNameSetupFormProps) {
  const [displayName, setDisplayName] = useState(suggested);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await completeStudentDisplayNameSetup(displayName);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success('Nama tampilan disimpan.');
      window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
      onCompleted();
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Selamat datang di JepangKu!
        </DialogTitle>
        <DialogDescription>
          Pilih nama tampilan yang akan muncul di leaderboard, profil, dan komunitas belajar. Kamu
          bisa mengubahnya nanti di halaman profil.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 py-4">
        <Label htmlFor="display-name-setup">Nama tampilan</Label>
        <Input
          id="display-name-setup"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Contoh: Kenji"
          autoComplete="nickname"
          maxLength={32}
          disabled={isPending}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          {displayName.length > 0 && (
            <span className={cn(displayName.length > 32 ? 'text-destructive' : '')}>
              {displayName.length}/32 karakter
            </span>
          )}
          {displayName.length === 0 ? '2–32 karakter. Huruf, angka, spasi, titik, strip.' : null}
        </p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <DialogFooter>
        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={isPending || displayName.trim().length < 2}
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan…
            </>
          ) : (
            'Lanjutkan'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PhoneSetupForm() {
  const core = useStudentCoreData();
  const [phone, setPhone] = useState(core.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await completeStudentPhoneSetup(phone);
      if (!result.ok) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success('Nomor ponsel disimpan.');
      window.dispatchEvent(new Event(STUDENT_CORE_DATA_REFRESH_EVENT));
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Phone className="size-5 text-primary" />
          Lengkapi nomor ponsel
        </DialogTitle>
        <DialogDescription>
          Silahkan untuk mengisi nomor ponsel dibawah ini.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2 py-4">
        <Label htmlFor="phone-setup">Nomor ponsel / WhatsApp</Label>
        <Input
          id="phone-setup"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Contoh: 08123456789 atau +819012345678"
          autoComplete="tel"
          maxLength={20}
          disabled={isPending}
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          Boleh nomor Indonesia atau luar negeri. Kamu bisa mengubahnya nanti di profil.
        </p>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <DialogFooter>
        <Button type="submit" className="w-full sm:w-auto" disabled={isPending || phone.trim().length < 8}>
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Menyimpan…
            </>
          ) : (
            'Selesai'
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Modal wajib saat login pertama — konfirmasi nama tampilan & nomor ponsel di LMS. */
export function DisplayNameSetupGate() {
  const core = useStudentCoreData();
  const { identity, isLoaded } = useClerkIdentity();
  const [nameStepDone, setNameStepDone] = useState(false);

  const suggested =
    core.suggestedDisplayName?.trim() ||
    identity?.displayName?.trim() ||
    core.displayName?.trim() ||
    '';

  const showNameStep = core.needsDisplayNameSetup && !nameStepDone;
  const showPhoneStep = !showNameStep && core.needsPhoneSetup;
  const open = isLoaded && core.status === 'ready' && (showNameStep || showPhoneStep);

  if (!open) return null;

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        {showNameStep ? (
          <DisplayNameSetupForm
            key={`${core.userId ?? 'guest'}-${suggested}`}
            suggested={suggested}
            onCompleted={() => setNameStepDone(true)}
          />
        ) : (
          <PhoneSetupForm key={`phone-${core.userId ?? 'guest'}`} />
        )}
      </DialogContent>
    </Dialog>
  );
}
