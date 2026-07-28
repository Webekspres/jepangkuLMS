export const LIVE_CLASS_CATEGORIES = [
  'Tata Bahasa',
  'Kosa Kata',
  'Kanji',
  'Speaking',
  'JLPT Tips',
  'JLPT Terpadu',
] as const;

export const LIVE_CLASS_FILTER_CATEGORIES = ['Semua', ...LIVE_CLASS_CATEGORIES] as const;
