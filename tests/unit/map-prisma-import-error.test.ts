import { describe, expect, test } from 'bun:test';
import { Prisma } from '@prisma/client';
import { mapPrismaImportError } from '@/features/admin-cms/lib/import-framework/map-prisma-import-error';

describe('mapPrismaImportError', () => {
  test('maps module order unique conflict to friendly message', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['courseId', 'order'] },
    });

    const mapped = mapPrismaImportError(error);
    expect(mapped).not.toBeNull();
    expect(mapped!.message).toContain('kursus');
    expect(mapped!.errors[0]?.code).toBe('MODULE_ORDER_CONFLICT');
  });

  test('maps slug conflict', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: { target: ['slug'] },
    });

    const mapped = mapPrismaImportError(error);
    expect(mapped?.errors[0]?.code).toBe('SLUG_CONFLICT');
    expect(mapped?.message).toContain('slug');
  });

  test('returns null for non-prisma errors', () => {
    expect(mapPrismaImportError(new Error('boom'))).toBeNull();
  });
});
