import { describe, expect, test } from 'bun:test';
import { prependLinePrefix, wrapSelection } from '@/features/admin-cms/lib/markdown-toolbar-helpers';

describe('markdown-toolbar-helpers', () => {
    test('wrapSelection wraps selected text', () => {
        const result = wrapSelection('halo dunia', 0, 4, '**');
        expect(result.next).toBe('**halo** dunia');
    });

    test('wrapSelection inserts placeholder when no selection', () => {
        const result = wrapSelection('halo', 2, 2, '*');
        expect(result.next).toBe('ha*teks*lo');
    });

    test('prependLinePrefix prefixes multiline selection', () => {
        const text = 'baris satu\nbaris dua';
        const result = prependLinePrefix(text, 0, text.length, (idx) => `${idx + 1}. `);
        expect(result.next).toBe('1. baris satu\n2. baris dua');
    });
});
