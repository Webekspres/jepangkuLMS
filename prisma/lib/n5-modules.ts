import type { N5Module } from './n5-curriculum';

export type N5ModuleDef = {
  slug: N5Module;
  title: string;
  description: string;
  order: number;
};

/** Modul resmi kurikulum N5 — disimpan di DB sebagai entitas Module. */
export const N5_MODULE_DEFINITIONS: N5ModuleDef[] = [
  {
    slug: 'aksara',
    title: 'Modul 1 — Hiragana & Katakana',
    description: '6 pelajaran · fondasi aksara Jepang',
    order: 1,
  },
  {
    slug: 'kanji',
    title: 'Modul 2 — Kanji N5',
    description: '11 topik kanji per kategori',
    order: 2,
  },
  {
    slug: 'kosakata',
    title: 'Modul 3 — Kosakata N5',
    description: '20 topik kosakata tematik',
    order: 3,
  },
  {
    slug: 'tata-bahasa',
    title: 'Modul 4 — Tata Bahasa N5',
    description: '19 pola tata bahasa',
    order: 4,
  },
  {
    slug: 'kuis',
    title: 'Modul 5 — Kuis Latihan',
    description: '2 set kuis pilihan ganda',
    order: 5,
  },
  {
    slug: 'tryout',
    title: 'Modul 6 — Try Out & Simulasi',
    description: 'Placement test + simulasi JLPT N5',
    order: 6,
  },
];
