'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { formatRupiahInput, parseRupiahInput } from '@/lib/lms/format-price';
import { cn } from '@/lib/utils';

type RupiahInputProps = {
  /** Nama field — hidden input ini yang dikirim ke server (integer murni). */
  name: string;
  id?: string;
  defaultValue?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Input mata uang Rupiah: tampil dengan pemisah ribuan (1.000.000),
 * tetapi submit nilai integer murni (1000000) via hidden input `name`.
 */
export function RupiahInput({
  name,
  id,
  defaultValue = 0,
  placeholder = '0',
  className,
  disabled,
}: RupiahInputProps) {
  const [display, setDisplay] = useState(() =>
    defaultValue > 0 ? formatRupiahInput(defaultValue) : '',
  );

  const numericValue = parseRupiahInput(display);

  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        Rp
      </span>
      <Input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        value={display}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => setDisplay(formatRupiahInput(event.target.value))}
        className="pl-9"
      />
      <input type="hidden" name={name} value={numericValue} />
    </div>
  );
}
