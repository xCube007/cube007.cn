import { describe, it, expect } from 'vitest';
import { compareText } from './text-diff';

describe('compareText', () => {
  it('两边相同则每行均为 same，无高亮', () => {
    const r = compareText('a\nb', 'a\nb');
    expect(r.left).toEqual([
      {
        lineNumber: 1,
        kind: 'same',
        segments: [{ text: 'a', highlight: false }],
      },
      {
        lineNumber: 2,
        kind: 'same',
        segments: [{ text: 'b', highlight: false }],
      },
    ]);
    expect(r.right).toEqual(r.left);
  });

  it('先把 \\r\\n / \\r 统一成 \\n 再比，避免假差异', () => {
    const r = compareText('a\r\nb', 'a\nb');
    expect(r.left).toHaveLength(2);
    expect(r.left.every((l) => l.kind === 'same')).toBe(true);
    expect(r.right.every((l) => l.kind === 'same')).toBe(true);
  });

  it('仅左侧有的行标 only，右侧对齐占位 empty', () => {
    const r = compareText('a\nb', 'a');
    expect(r.left).toEqual([
      {
        lineNumber: 1,
        kind: 'same',
        segments: [{ text: 'a', highlight: false }],
      },
      {
        lineNumber: 2,
        kind: 'only',
        segments: [{ text: 'b', highlight: false }],
      },
    ]);
    expect(r.right).toEqual([
      {
        lineNumber: 1,
        kind: 'same',
        segments: [{ text: 'a', highlight: false }],
      },
      { lineNumber: null, kind: 'empty', segments: [] },
    ]);
  });

  it('仅右侧有的行标 only，左侧对齐占位 empty', () => {
    const r = compareText('a', 'a\nb');
    expect(r.left[1]).toEqual({
      lineNumber: null,
      kind: 'empty',
      segments: [],
    });
    expect(r.right[1]).toEqual({
      lineNumber: 2,
      kind: 'only',
      segments: [{ text: 'b', highlight: false }],
    });
  });

  it('同行内容不同则 changed，并按字符标出差异', () => {
    const r = compareText('hello', 'hallo');
    expect(r.left).toHaveLength(1);
    expect(r.left[0]!.kind).toBe('changed');
    expect(r.right[0]!.kind).toBe('changed');
    expect(r.left[0]!.segments).toEqual([
      { text: 'h', highlight: false },
      { text: 'e', highlight: true },
      { text: 'llo', highlight: false },
    ]);
    expect(r.right[0]!.segments).toEqual([
      { text: 'h', highlight: false },
      { text: 'a', highlight: true },
      { text: 'llo', highlight: false },
    ]);
  });

  it('两边都空时各有一行空 same', () => {
    const r = compareText('', '');
    expect(r.left).toEqual([
      { lineNumber: 1, kind: 'same', segments: [] },
    ]);
    expect(r.right).toEqual(r.left);
  });
});
