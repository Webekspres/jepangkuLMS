import { describe, expect, test } from 'bun:test';
import { parseClerkUserCreatedEvent } from '@/lib/email/parse-clerk-user-created';

describe('parseClerkUserCreatedEvent', () => {
  test('extracts primary email and full name', () => {
    const result = parseClerkUserCreatedEvent({
      type: 'user.created',
      data: {
        id: 'user_abc',
        first_name: 'Budi',
        last_name: 'Santoso',
        primary_email_address_id: 'em_1',
        email_addresses: [
          { id: 'em_2', email_address: 'secondary@example.com' },
          { id: 'em_1', email_address: 'budi@example.com' },
        ],
      },
    });

    expect(result).toEqual({
      userId: 'user_abc',
      email: 'budi@example.com',
      name: 'Budi Santoso',
    });
  });

  test('falls back to email local-part when name missing', () => {
    const result = parseClerkUserCreatedEvent({
      type: 'user.created',
      data: {
        id: 'user_xyz',
        email_addresses: [{ id: 'em_1', email_address: 'siswa@example.com' }],
      },
    });

    expect(result?.name).toBe('siswa');
    expect(result?.email).toBe('siswa@example.com');
  });

  test('returns null for non user.created events', () => {
    expect(
      parseClerkUserCreatedEvent({
        type: 'user.updated',
        data: { id: 'user_abc', email_addresses: [] },
      }),
    ).toBeNull();
  });

  test('returns null when email is missing', () => {
    expect(
      parseClerkUserCreatedEvent({
        type: 'user.created',
        data: { id: 'user_abc', email_addresses: [] },
      }),
    ).toBeNull();
  });
});
