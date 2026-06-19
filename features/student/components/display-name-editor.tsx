'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateStudentDisplayName } from '@/features/student/actions/profile-actions';

type DisplayNameEditorProps = {
  currentName: string;
};

export function DisplayNameEditor({ currentName }: DisplayNameEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateStudentDisplayName(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={() => {
          setValue(currentName);
          setEditing(true);
        }}
      >
        <Pencil className="size-3.5" />
        Ubah nama tampilan
      </Button>
    );
  }

  return (
    <div className="mt-4 w-full max-w-sm space-y-2">
      <label className="text-xs font-medium text-muted-foreground" htmlFor="display-name">
        Nama tampilan di LMS (2–32 karakter)
      </label>
      <Input
        id="display-name"
        value={value}
        maxLength={32}
        disabled={isPending}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Contoh: Kenji"
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={isPending} onClick={handleSave}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Simpan'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
          Batal
        </Button>
      </div>
    </div>
  );
}
