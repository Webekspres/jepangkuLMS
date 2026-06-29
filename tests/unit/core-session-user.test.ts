import { describe, expect, test } from 'bun:test';
import {
    coreSessionUserId,
    isCoreSessionForClerkUser,
} from '@/lib/auth/core-session-user';
import type { CoreSession } from '@/lib/core/session';

function sessionFor(sub: string): CoreSession {
    return {
        claims: { sub },
        profile: { id: sub, displayName: 'Test', avatarUrl: null },
        gamification: { userId: sub, totalXp: 10, level: 1 },
        roles: [],
    };
}

describe('isCoreSessionForClerkUser', () => {
    test('accepts matching Clerk user id', () => {
        expect(isCoreSessionForClerkUser(sessionFor('user_a'), 'user_a')).toBe(true);
    });

    test('rejects stale Core JWT from another user', () => {
        expect(isCoreSessionForClerkUser(sessionFor('user_a'), 'user_b')).toBe(false);
    });

    test('coreSessionUserId reads sub claim', () => {
        expect(coreSessionUserId(sessionFor('user_xyz'))).toBe('user_xyz');
    });
});
