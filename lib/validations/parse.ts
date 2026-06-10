import type { ZodType } from 'zod';

export type ValidationSuccess<T> = {
  success: true;
  data: T;
};

export type ValidationFailure = {
  success: false;
  error: string;
  fieldErrors: Record<string, string[]>;
};

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

/**
 * Parse input untuk Server Actions / API routes.
 * Kembalikan bentuk yang mudah ditampilkan di form client.
 */
export function parseInput<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  const result = schema.safeParse(input);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fieldErrors: Record<string, string[]> = {};

  for (const issue of result.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_form';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }

  return {
    success: false,
    error: result.error.issues[0]?.message ?? 'Validasi gagal',
    fieldErrors,
  };
}
