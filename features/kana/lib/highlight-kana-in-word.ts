export type KanaWordHighlightSegment = {
  text: string;
  highlight: boolean;
};

export function splitKanaWordHighlight(
  word: string,
  highlightChar: string,
): KanaWordHighlightSegment[] {
  if (!word) return [];
  if (!highlightChar) return [{ text: word, highlight: false }];

  const index = word.indexOf(highlightChar);
  if (index === -1) return [{ text: word, highlight: false }];

  const segments: KanaWordHighlightSegment[] = [];

  if (index > 0) {
    segments.push({ text: word.slice(0, index), highlight: false });
  }

  segments.push({ text: highlightChar, highlight: true });

  const afterIndex = index + highlightChar.length;
  if (afterIndex < word.length) {
    segments.push({ text: word.slice(afterIndex), highlight: false });
  }

  return segments;
}
