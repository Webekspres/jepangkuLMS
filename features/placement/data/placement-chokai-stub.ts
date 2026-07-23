import type { PlacementQuestion } from './types';

/**
 * Temporary Choukai stubs for UI preview (no image assets).
 * Replace with sensei images later; keep `mondai: CHOKAI_1…4` grouping.
 */
export const PLACEMENT_CHOKAI_STUB_QUESTIONS: PlacementQuestion[] = [
  // —— Mondai 1 (image options — placeholder boxes until sensei assets) ——
  {
    id: 'chokai-m1-1',
    section: 'CHOKAI',
    mondai: 'CHOKAI_1',
    order: 101,
    prompt: 'もんだい1 — ばん 1（stub）。いちばんいいものをえらんでください。',
    optionKind: 'IMAGE',
    options: [
      { id: 'chokai-m1-1-a', label: '1', imageUrl: null },
      { id: 'chokai-m1-1-b', label: '2', imageUrl: null },
      { id: 'chokai-m1-1-c', label: '3', imageUrl: null },
      { id: 'chokai-m1-1-d', label: '4', imageUrl: null },
    ],
    correctOptionId: 'chokai-m1-1-b',
  },
  {
    id: 'chokai-m1-2',
    section: 'CHOKAI',
    mondai: 'CHOKAI_1',
    order: 102,
    prompt: 'もんだい1 — ばん 2（stub）。',
    optionKind: 'IMAGE',
    options: [
      { id: 'chokai-m1-2-a', label: '1', imageUrl: null },
      { id: 'chokai-m1-2-b', label: '2', imageUrl: null },
      { id: 'chokai-m1-2-c', label: '3', imageUrl: null },
      { id: 'chokai-m1-2-d', label: '4', imageUrl: null },
    ],
    correctOptionId: 'chokai-m1-2-c',
  },
  {
    id: 'chokai-m1-3',
    section: 'CHOKAI',
    mondai: 'CHOKAI_1',
    order: 103,
    prompt: 'もんだい1 — ばん 3（stub）。',
    optionKind: 'IMAGE',
    options: [
      { id: 'chokai-m1-3-a', label: '1', imageUrl: null },
      { id: 'chokai-m1-3-b', label: '2', imageUrl: null },
      { id: 'chokai-m1-3-c', label: '3', imageUrl: null },
      { id: 'chokai-m1-3-d', label: '4', imageUrl: null },
    ],
    correctOptionId: 'chokai-m1-3-a',
  },
  // —— Mondai 2 (text) ——
  {
    id: 'chokai-m2-1',
    section: 'CHOKAI',
    mondai: 'CHOKAI_2',
    order: 201,
    prompt: 'もんだい2 — ばん 1（stub）。',
    optionKind: 'TEXT',
    options: [
      { id: 'chokai-m2-1-a', label: 'としょかん' },
      { id: 'chokai-m2-1-b', label: 'えき' },
      { id: 'chokai-m2-1-c', label: 'デパート' },
      { id: 'chokai-m2-1-d', label: 'レストラン' },
    ],
    correctOptionId: 'chokai-m2-1-b',
  },
  {
    id: 'chokai-m2-2',
    section: 'CHOKAI',
    mondai: 'CHOKAI_2',
    order: 202,
    prompt: 'もんだい2 — ばん 2（stub）。',
    optionKind: 'TEXT',
    options: [
      { id: 'chokai-m2-2-a', label: '1じかん' },
      { id: 'chokai-m2-2-b', label: '2じかん' },
      { id: 'chokai-m2-2-c', label: '3じかん' },
      { id: 'chokai-m2-2-d', label: '4じかん' },
    ],
    correctOptionId: 'chokai-m2-2-a',
  },
  {
    id: 'chokai-m2-3',
    section: 'CHOKAI',
    mondai: 'CHOKAI_2',
    order: 203,
    prompt: 'もんだい2 — ばん 3（stub）。',
    optionKind: 'TEXT',
    options: [
      { id: 'chokai-m2-3-a', label: 'きょう' },
      { id: 'chokai-m2-3-b', label: 'あした' },
      { id: 'chokai-m2-3-c', label: 'あさって' },
      { id: 'chokai-m2-3-d', label: 'きのう' },
    ],
    correctOptionId: 'chokai-m2-3-b',
  },
  // —— Mondai 3 (numbers; scene image later from sensei) ——
  {
    id: 'chokai-m3-1',
    section: 'CHOKAI',
    mondai: 'CHOKAI_3',
    order: 301,
    prompt: 'もんだい3 — ばん 1（stub）。矢印の人は何と言いますか。',
    optionKind: 'NUMBER',
    options: [
      { id: 'chokai-m3-1-a', label: '1' },
      { id: 'chokai-m3-1-b', label: '2' },
      { id: 'chokai-m3-1-c', label: '3' },
    ],
    correctOptionId: 'chokai-m3-1-a',
  },
  {
    id: 'chokai-m3-2',
    section: 'CHOKAI',
    mondai: 'CHOKAI_3',
    order: 302,
    prompt: 'もんだい3 — ばん 2（stub）。',
    optionKind: 'NUMBER',
    options: [
      { id: 'chokai-m3-2-a', label: '1' },
      { id: 'chokai-m3-2-b', label: '2' },
      { id: 'chokai-m3-2-c', label: '3' },
    ],
    correctOptionId: 'chokai-m3-2-b',
  },
  // —— Mondai 4 (numbers + memo) ——
  {
    id: 'chokai-m4-1',
    section: 'CHOKAI',
    mondai: 'CHOKAI_4',
    order: 401,
    prompt: 'もんだい4 — ばん 1（stub）。いちばんいいものをえらんでください。',
    optionKind: 'NUMBER',
    options: [
      { id: 'chokai-m4-1-a', label: '1' },
      { id: 'chokai-m4-1-b', label: '2' },
      { id: 'chokai-m4-1-c', label: '3' },
    ],
    correctOptionId: 'chokai-m4-1-c',
  },
  {
    id: 'chokai-m4-2',
    section: 'CHOKAI',
    mondai: 'CHOKAI_4',
    order: 402,
    prompt: 'もんだい4 — ばん 2（stub）。',
    optionKind: 'NUMBER',
    options: [
      { id: 'chokai-m4-2-a', label: '1' },
      { id: 'chokai-m4-2-b', label: '2' },
      { id: 'chokai-m4-2-c', label: '3' },
    ],
    correctOptionId: 'chokai-m4-2-a',
  },
];
