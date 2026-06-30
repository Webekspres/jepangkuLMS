export function resolveTryoutAudioPlayKey(input: {
    questionId: string;
    audioGroupId: string | null;
}): string {
    if (input.audioGroupId) return `group:${input.audioGroupId}`;
    return `single:${input.questionId}`;
}
