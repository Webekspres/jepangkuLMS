'use client';

import { useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Heading2, Italic, Link2, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { prependLinePrefix, wrapSelection } from '@/features/admin-cms/lib/markdown-toolbar-helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type MarkdownToolbarTextareaProps = {
    id: string;
    value: string;
    onChange: (next: string) => void;
    placeholder?: string;
    rows?: number;
    className?: string;
};

export function MarkdownToolbarTextarea({
    id,
    value,
    onChange,
    placeholder,
    rows = 8,
    className,
}: MarkdownToolbarTextareaProps) {
    const [tab, setTab] = useState<'write' | 'preview'>('write');
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const actions = useMemo(
        () => [
            {
                key: 'bold',
                label: 'Bold',
                icon: Bold,
                run: (text: string, start: number, end: number) => wrapSelection(text, start, end, '**'),
            },
            {
                key: 'italic',
                label: 'Italic',
                icon: Italic,
                run: (text: string, start: number, end: number) => wrapSelection(text, start, end, '*'),
            },
            {
                key: 'heading',
                label: 'Heading',
                icon: Heading2,
                run: (text: string, start: number, end: number) => prependLinePrefix(text, start, end, () => '## '),
            },
            {
                key: 'bullet',
                label: 'Bullet List',
                icon: List,
                run: (text: string, start: number, end: number) => prependLinePrefix(text, start, end, () => '- '),
            },
            {
                key: 'ordered',
                label: 'Numbered List',
                icon: ListOrdered,
                run: (text: string, start: number, end: number) =>
                    prependLinePrefix(text, start, end, (idx) => `${idx + 1}. `),
            },
            {
                key: 'link',
                label: 'Link',
                icon: Link2,
                run: (text: string, start: number, end: number) => {
                    const selected = text.slice(start, end) || 'tautan';
                    const replacement = `[${selected}](https://example.com)`;
                    const next = text.slice(0, start) + replacement + text.slice(end);
                    return { next, cursor: start + replacement.length };
                },
            },
        ],
        [],
    );

    const applyAction = (runner: (text: string, start: number, end: number) => { next: string; cursor: number }) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        const { selectionStart, selectionEnd } = textarea;
        const { next, cursor } = runner(value, selectionStart, selectionEnd);
        onChange(next);

        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(cursor, cursor);
        });
    };

    return (
        <div className={cn('rounded-xl border border-border', className)}>
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'write' | 'preview')}>
                <div className="border-b border-border px-3 py-2">
                    <div className="mb-2 flex flex-wrap gap-1">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Button
                                    key={action.key}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyAction(action.run)}
                                >
                                    <Icon className="size-4" />
                                    {action.label}
                                </Button>
                            );
                        })}
                    </div>
                    <TabsList>
                        <TabsTrigger value="write">Tulis</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="write" className="m-0 p-3">
                    <Textarea
                        ref={textareaRef}
                        id={id}
                        value={value}
                        onChange={(event) => onChange(event.target.value)}
                        rows={rows}
                        placeholder={placeholder}
                    />
                </TabsContent>

                <TabsContent value="preview" className="m-0 p-3">
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground ">
                        {value.trim() ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown> : <p className="text-muted-foreground">Belum ada konten.</p>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
