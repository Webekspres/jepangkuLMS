/**
 * Count flattened exam questions from Paket Soal / session composition items.
 * Choukai items expand to N questions under each ListeningStimulus.
 */
export type TryoutCompositionCountItem = {
  jlptQuestionId: string | null;
  listeningStimulus: { _count: { questions: number } } | null;
};

export function countTryoutCompositionQuestions(items: TryoutCompositionCountItem[]): number {
  let total = 0;
  for (const item of items) {
    if (item.listeningStimulus) {
      total += item.listeningStimulus._count.questions;
    } else if (item.jlptQuestionId) {
      total += 1;
    }
  }
  return total;
}
