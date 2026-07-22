import { describe, expect, test } from 'bun:test';
import { splitKanaWordHighlight } from './highlight-kana-in-word';

describe('splitKanaWordHighlight', () => {
  test('highlights only the studied katakana in アイス', () => {
    expect(splitKanaWordHighlight('アイス', 'ア')).toEqual([
      { text: 'ア', highlight: true },
      { text: 'イス', highlight: false },
    ]);
  });

  test('highlights yoon compound じゃ in じゃま', () => {
    expect(splitKanaWordHighlight('じゃま', 'じゃ')).toEqual([
      { text: 'じゃ', highlight: true },
      { text: 'ま', highlight: false },
    ]);
  });

  test('highlights が in がっこう', () => {
    expect(splitKanaWordHighlight('がっこう', 'が')).toEqual([
      { text: 'が', highlight: true },
      { text: 'っこう', highlight: false },
    ]);
  });

  test('returns unhighlighted word when char is not found', () => {
    expect(splitKanaWordHighlight('みず', 'あ')).toEqual([{ text: 'みず', highlight: false }]);
  });

  test('returns empty array for empty word', () => {
    expect(splitKanaWordHighlight('', 'ア')).toEqual([]);
  });
});
