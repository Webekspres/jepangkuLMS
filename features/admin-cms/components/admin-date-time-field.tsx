'use client';

import { CalendarIcon, Clock3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  formatDateTimePickerLabel,
  parseJakartaDateTimeInput,
  replaceDatePart,
  replaceTimePart,
} from '@/features/admin-cms/lib/admin-date-time';
import { cn } from '@/lib/utils';

type AdminDateTimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function AdminDateTimeField({
  value,
  onChange,
  placeholder = 'Pilih tanggal & waktu',
}: AdminDateTimeFieldProps) {
  const selectedDate = parseJakartaDateTimeInput(value);
  const timeValue = value.split('T')[1] ?? '';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'h-auto w-full justify-between px-3 py-2 text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <span className="truncate">{value ? formatDateTimePickerLabel(value) : placeholder}</span>
          <CalendarIcon className="size-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-3">
        <div className="space-y-3">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={(nextDate) => {
              if (!nextDate) return;
              onChange(replaceDatePart(value, nextDate));
            }}
          />
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Clock3 className="size-3.5" />
              Waktu (WIB)
            </div>
            <Input
              type="time"
              step={60}
              value={timeValue}
              onChange={(event) => onChange(replaceTimePart(value, event.target.value))}
              disabled={!value}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
