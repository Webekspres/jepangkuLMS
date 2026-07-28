const JAKARTA_OFFSET = '+07:00';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function parseJakartaDateTimeInput(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00${JAKARTA_OFFSET}`);
}

export function formatJakartaDateTimeInput(date: Date | null | undefined): string {
  if (!date) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

export function formatDateTimePickerLabel(value: string): string {
  const parsed = parseJakartaDateTimeInput(value);
  if (!parsed) return 'Pilih tanggal & waktu';

  return parsed.toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function replaceDatePart(value: string, date: Date): string {
  const timePart = value.split('T')[1] || '09:00';
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}T${timePart}`;
}

export function replaceTimePart(value: string, time: string): string {
  const datePart = value.split('T')[0];
  if (!datePart) return '';
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) return value;
  return `${datePart}T${match[1]}:${match[2]}`;
}
