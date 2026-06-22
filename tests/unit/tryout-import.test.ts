import { describe, expect, test } from 'bun:test';
import {
  normalizeTryoutSection,
  composeTryoutQuestionText,
  extractAudioUrlFromQuestionText,
} from '@/features/admin-cms/lib/tryout-sections';
import { parseTryoutImportText } from '@/features/admin-cms/lib/import-tryout-questions';

describe('tryout sections', () => {
  test('normalizeTryoutSection maps aliases', () => {
    expect(normalizeTryoutSection('Moji-Goi')).toBe('MOJI_GOI');
    expect(normalizeTryoutSection('bunpou dokkai')).toBe('BUNPOU_DOKKAI');
    expect(normalizeTryoutSection('CHOKAI')).toBe('CHOKAI');
    expect(normalizeTryoutSection('invalid')).toBeNull();
  });

  test('audio marker roundtrip', () => {
    const text = composeTryoutQuestionText('Pertanyaan?', 'https://x.com/a.mp3');
    const parsed = extractAudioUrlFromQuestionText(text);
    expect(parsed.audioUrl).toBe('https://x.com/a.mp3');
    expect(parsed.body).toBe('Pertanyaan?');
  });
});

describe('tryout import parser', () => {
  test('parses valid CSV template rows', () => {
    const csv = `No,Section,QuestionText,Explanation,Options,CorrectOptionIndex,AudioUrl,AudioGroupId
1,MOJI_GOI,"Soal 1","Exp","A\\nB\\nC\\nD",2,,
2,CHOKAI,"Soal 2","","X\\nY",1,https://audio.test/mp3,chokai-1
3,CHOKAI,"Soal 3","","P\\nQ",2,,chokai-1`;

    const preview = parseTryoutImportText(csv);
    expect(preview.ok).toBe(true);
    expect(preview.rowCount).toBe(3);
    expect(preview.validRows[0]?.correctIndex).toBe(1);
    expect(preview.validRows[1]?.audioUrl).toBe('https://audio.test/mp3');
    expect(preview.validRows[1]?.audioGroupId).toBe('chokai-1');
    expect(preview.validRows[2]?.audioUrl).toBe('https://audio.test/mp3');
    expect(preview.validRows[2]?.audioGroupId).toBe('chokai-1');
  });

  test('reports missing group audio on first row', () => {
    const csv = `Section,QuestionText,Options,CorrectOptionIndex,AudioGroupId
CHOKAI,"Q","A\\nB",1,chokai-1`;

    const preview = parseTryoutImportText(csv);
    expect(preview.ok).toBe(false);
    expect(preview.errors[0]?.message).toContain('AudioGroupId');
  });

  test('reports invalid correct index', () => {
    const csv = `Section,QuestionText,Options,CorrectOptionIndex
MOJI_GOI,"Q","A\\nB",9`;

    const preview = parseTryoutImportText(csv);
    expect(preview.ok).toBe(false);
    expect(preview.errors[0]?.message).toContain('CorrectOptionIndex');
  });
});
