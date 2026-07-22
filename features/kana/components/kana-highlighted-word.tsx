import { splitKanaWordHighlight } from '@/features/kana/lib/highlight-kana-in-word';
import { cn } from '@/lib/utils';

type KanaHighlightedWordProps = {
  word: string;
  highlightChar: string;
  className?: string;
};

export function KanaHighlightedWord({ word, highlightChar, className }: KanaHighlightedWordProps) {
  const segments = splitKanaWordHighlight(word, highlightChar);

  return (
    <p className={cn('truncate text-base font-bold', className)}>
      {segments.map((segment, index) => (
        <span
          key={`${segment.text}-${index}`}
          className={segment.highlight ? 'text-primary' : 'text-foreground'}
        >
          {segment.text}
        </span>
      ))}
    </p>
  );
}
