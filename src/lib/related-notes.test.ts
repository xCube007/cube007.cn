import { describe, it, expect } from 'vitest';
import { findRelatedNotes, type RelatedNoteInput } from './related-notes';

const notes: RelatedNoteInput[] = [
  {
    id: 'a',
    title: 'Git rebase',
    tags: ['编程', 'Git'],
    date: '2026-07-26',
  },
  {
    id: 'b',
    title: '静态站选型',
    tags: ['编程', '随笔'],
    date: '2026-07-27',
  },
  {
    id: 'c',
    title: '数据库索引',
    tags: ['后端', '数据库'],
    date: '2026-07-20',
  },
  {
    id: 'd',
    title: '自动部署',
    tags: ['编程', 'DevOps'],
    date: '2026-07-28',
  },
  {
    id: 'e',
    title: '无标签笔记',
    tags: [],
    date: '2026-07-01',
  },
];

describe('findRelatedNotes', () => {
  it('排除自己', () => {
    const r = findRelatedNotes(notes[0], notes);
    expect(r.every((x) => x.id !== 'a')).toBe(true);
  });

  it('按共享标签数排序', () => {
    // a 与 b/d 各共享 1 个「编程」
    const r = findRelatedNotes(notes[0], notes, 5);
    expect(r.map((x) => x.id)).toEqual(['d', 'b']);
    expect(r[0].score).toBe(1);
  });

  it('同分时按日期新→旧', () => {
    const r = findRelatedNotes(notes[0], notes, 5);
    // d(07-28) 应排在 b(07-27) 前
    expect(r[0].id).toBe('d');
    expect(r[1].id).toBe('b');
  });

  it('无共享标签则不入选', () => {
    const r = findRelatedNotes(notes[0], notes, 5);
    expect(r.find((x) => x.id === 'c')).toBeUndefined();
  });

  it('当前笔记无标签返回空', () => {
    expect(findRelatedNotes(notes[4], notes)).toEqual([]);
  });

  it('尊重 limit', () => {
    const r = findRelatedNotes(notes[0], notes, 1);
    expect(r).toHaveLength(1);
  });

  it('返回 sharedTags', () => {
    const r = findRelatedNotes(notes[0], notes, 1);
    expect(r[0].sharedTags).toEqual(['编程']);
  });
});
