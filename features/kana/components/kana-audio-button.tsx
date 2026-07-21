'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playKanaAudio } from '@/features/kana/lib/kana-audio';
import { cn } from '@/lib/utils';

type KanaAudioButtonProps = {
  src: string;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
  onMissing?: () => void;
};

export function KanaAudioButton({
  src,
  label,
  size = 'md',
  className,
  onMissing,
}: KanaAudioButtonProps) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'missing'>('idle');

  const handlePlay = async () => {
    if (status === 'missing') return;

    setStatus('playing');
    const ok = await playKanaAudio(src);

    if (!ok) {
      setStatus('missing');
      onMissing?.();
      return;
    }

    setStatus('idle');
  };

  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4';
  const buttonSize = size === 'sm' ? 'size-7' : 'size-9';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={status === 'missing' ? `${label} — audio belum tersedia` : `Putar bunyi ${label}`}
      disabled={status === 'missing'}
      onClick={(e) => {
        e.stopPropagation();
        void handlePlay();
      }}
      className={cn(
        buttonSize,
        'shrink-0 rounded-full text-primary hover:bg-primary/10',
        status === 'missing' && 'cursor-not-allowed opacity-40',
        className,
      )}
    >
      <Volume2 className={iconSize} />
    </Button>
  );
}
