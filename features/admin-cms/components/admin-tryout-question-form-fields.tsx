'use client';

import type { LevelJLPT } from '@prisma/client';
import {
  AdminTryoutChokaiAudioForm,
  type ChokaiAudioFormValue,
} from '@/features/admin-cms/components/admin-tryout-chokai-audio-form';
import type { TryoutSectionValue } from '@/features/admin-cms/lib/tryout-sections';
import { getTryoutSectionMeta } from '@/features/admin-cms/lib/tryout-sections';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export type TryoutQuestionFormState = {
  questionText: string;
  explanation: string;
  audioMode: ChokaiAudioFormValue['audioMode'];
  audioUrl: string;
  audioGroupId: string;
  options: { text: string; isCorrect: boolean }[];
  correctIndex: string;
};

export function emptyTryoutQuestionForm(): TryoutQuestionFormState {
  return {
    questionText: '',
    explanation: '',
    audioMode: 'single',
    audioUrl: '',
    audioGroupId: '',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    correctIndex: '0',
  };
}

type TryoutQuestionFormFieldsProps = {
  form: TryoutQuestionFormState;
  section: TryoutSectionValue;
  level: LevelJLPT;
  disabled?: boolean;
  onChange: (next: TryoutQuestionFormState) => void;
};

export function TryoutQuestionFormFields({
  form,
  section,
  level,
  disabled,
  onChange,
}: TryoutQuestionFormFieldsProps) {
  const sectionMeta = getTryoutSectionMeta(section);

  return (
    <div className="space-y-4">
      {section === 'CHOKAI' ? (
        <AdminTryoutChokaiAudioForm
          disabled={disabled}
          value={{
            audioMode: form.audioMode,
            audioUrl: form.audioUrl,
            audioGroupId: form.audioGroupId,
          }}
          onChange={(next) =>
            onChange({
              ...form,
              audioMode: next.audioMode,
              audioUrl: next.audioUrl,
              audioGroupId: next.audioGroupId,
            })
          }
        />
      ) : null}

      <div className="space-y-2">
        <Label>Pertanyaan</Label>
        <Textarea
          value={form.questionText}
          onChange={(e) => onChange({ ...form, questionText: e.target.value })}
          rows={4}
          placeholder="Teks soal / stem…"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Penjelasan (opsional)</Label>
        <Textarea
          value={form.explanation}
          onChange={(e) => onChange({ ...form, explanation: e.target.value })}
          rows={2}
          disabled={disabled}
        />
      </div>

      <div className="space-y-3">
        <Label>Opsi jawaban — pilih satu yang benar</Label>
        {form.options.map((opt, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct-${section}-${level}`}
              checked={form.correctIndex === String(index)}
              onChange={() => onChange({ ...form, correctIndex: String(index) })}
              disabled={disabled}
            />
            <Input
              value={opt.text}
              placeholder={`Opsi ${index + 1}`}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...form,
                  options: form.options.map((row, i) =>
                    i === index ? { ...row, text: e.target.value } : row,
                  ),
                })
              }
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Bagian: {sectionMeta.labelRomaji} · Level {level}
      </p>
    </div>
  );
}

export function buildTryoutQuestionPayload(
  sessionId: string,
  section: TryoutSectionValue,
  form: TryoutQuestionFormState,
) {
  return {
    tryoutSessionId: sessionId,
    tryoutSection: section,
    questionText: form.questionText,
    explanation: form.explanation,
    audioMode: form.audioMode,
    audioUrl: section === 'CHOKAI' ? form.audioUrl : '',
    audioGroupId: section === 'CHOKAI' && form.audioMode === 'group' ? form.audioGroupId : '',
    options: form.options.map((opt, index) => ({
      text: opt.text,
      isCorrect: String(index) === form.correctIndex,
    })),
  };
}
