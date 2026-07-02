export function wrapSelection(
    text: string,
    selectionStart: number,
    selectionEnd: number,
    wrapStart: string,
    wrapEnd: string = wrapStart,
) {
    const selected = text.slice(selectionStart, selectionEnd);
    const replaced = `${wrapStart}${selected || 'teks'}${wrapEnd}`;
    const next = text.slice(0, selectionStart) + replaced + text.slice(selectionEnd);
    const cursor = selectionStart + replaced.length;
    return { next, cursor };
}

export function prependLinePrefix(
    text: string,
    selectionStart: number,
    selectionEnd: number,
    prefixFactory: (index: number) => string,
) {
    const start = text.lastIndexOf('\n', selectionStart - 1) + 1;
    const endBreak = text.indexOf('\n', selectionEnd);
    const end = endBreak === -1 ? text.length : endBreak;
    const block = text.slice(start, end);
    const lines = block.split('\n');
    const withPrefix = lines.map((line, idx) => `${prefixFactory(idx)}${line || 'item'}`).join('\n');
    const next = text.slice(0, start) + withPrefix + text.slice(end);
    return { next, cursor: start + withPrefix.length };
}
