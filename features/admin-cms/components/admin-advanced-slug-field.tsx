'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatedCollapse } from '@/components/ui/animated-collapse';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateSlug, sanitizeSlugWhileTyping } from '@/lib/string-helpers';
import { cn } from '@/lib/utils';

type AdminAdvancedSlugFieldProps = {
  id: string;
  slug: string;
  onSlugChange: (slug: string) => void;
  error?: string;
  hint?: string;
};

export function AdminAdvancedSlugField({
  id,
  slug,
  onSlugChange,
  error,
  hint = 'Mengubah slug memutus tautan yang sudah dibagikan. Slug tidak ikut berubah saat judul diedit.',
}: AdminAdvancedSlugFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>Pengaturan lanjutan (URL slug)</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatedCollapse open={open}>
        <div className="space-y-2 rounded-lg border border-border bg-muted/10 p-4">
          <Label htmlFor={id}>Slug URL</Label>
          <Input
            id={id}
            value={slug}
            onChange={(event) => onSlugChange(sanitizeSlugWhileTyping(event.target.value))}
            onBlur={(event) => onSlugChange(generateSlug(event.target.value))}
            placeholder="contoh-judul-kursus"
            spellCheck={false}
            autoComplete="off"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </AnimatedCollapse>
    </div>
  );
}
