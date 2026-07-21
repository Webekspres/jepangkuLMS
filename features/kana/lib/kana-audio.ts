let activeAudio: HTMLAudioElement | null = null;

export function stopKanaAudio(): void {
  if (!activeAudio) return;
  activeAudio.pause();
  activeAudio.currentTime = 0;
  activeAudio = null;
}

export async function playKanaAudio(src: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  stopKanaAudio();

  const audio = new Audio(src);
  activeAudio = audio;

  try {
    await audio.play();
    return true;
  } catch {
    stopKanaAudio();
    return false;
  }
}
