import type { N4Module } from './n4-curriculum';

export type N4ModuleDef = {
    slug: N4Module;
    title: string;
    description: string;
    order: number;
};

export const N4_MODULE_DEFINITIONS: N4ModuleDef[] = [
    {
        slug: 'kanji',
        title: 'Modul 1 — Kanji N4',
        description: 'Topik kanji N4 berbasis kategori workbook',
        order: 1,
    },
    {
        slug: 'kosakata',
        title: 'Modul 2 — Kosakata N4',
        description: 'Kosakata N4 tematik berbasis kategori workbook',
        order: 2,
    },
    {
        slug: 'tata-bahasa',
        title: 'Modul 3 — Tata Bahasa N4',
        description: 'Pola tata bahasa N4 per kategori',
        order: 3,
    },
    {
        slug: 'kuis',
        title: 'Modul 4 — Kuis Latihan',
        description: '2 set kuis pilihan ganda N4',
        order: 4,
    },
    {
        slug: 'tryout',
        title: 'Modul 5 — Try Out N4',
        description: 'Simulasi try out N4 dari workbook sensei',
        order: 5,
    },
];
