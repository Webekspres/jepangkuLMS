export type PlacementSectionCode = 'MOJI_GOI' | 'BUNPOU_DOKKAI' | 'CHOKAI';

export type PlacementMondai =
  | 'MOJI'
  | 'BUNPOU'
  | 'CHOKAI_1'
  | 'CHOKAI_2'
  | 'CHOKAI_3'
  | 'CHOKAI_4';

export type PlacementOptionKind = 'TEXT' | 'IMAGE' | 'NUMBER';

export type PlacementOption = {
  id: string;
  /** Display for TEXT; for NUMBER use "1"|"2"|"3"; IMAGE may include short label */
  label: string;
  imageUrl?: string | null;
};

export type PlacementQuestion = {
  id: string;
  section: PlacementSectionCode;
  mondai: PlacementMondai;
  /** Order within the full paper (1-based display) */
  order: number;
  prompt: string;
  optionKind: PlacementOptionKind;
  options: PlacementOption[];
  correctOptionId: string;
  /** Optional answer explanation (from sensei sheet) */
  explanation?: string;
  /** Scene / stem image (Choukai Mondai 3, optional stem elsewhere) */
  sceneImageUrl?: string | null;
  /** Timestamp hints on master audio (ms) — sync / QA; playback is continuous */
  audioStartMs?: number;
  audioEndMs?: number;
};

export type PlacementPaper = {
  id: string;
  title: string;
  version: number;
  /** Continuous Choukai master — null until asset dropped in public/ */
  chokaiAudioUrl: string | null;
  questions: PlacementQuestion[];
};

export type PlacementLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export type PlacementScoreBand = {
  minPercent: number;
  maxPercent: number;
  level: PlacementLevel;
  blurb: string;
};
