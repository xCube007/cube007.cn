import { describe, it, expect } from 'vitest';
import { searchNotes, type SearchItem } from './search';

const items: SearchItem[] = [
  {
    id: 'a',
    title: 'Git rebase 与 merge',
    description: '分支合并策略',
    tags: ['编程', 'Git'],
    date: '2026-07-26',
    href: '/notes/a/',
  },
  {
    id: 'b',
    title: 'Embedding 入门',
    description: '向量语义检索',
    tags: ['AI', '向量'],
    date: '2026-07-10',
    href: '/notes/b/',
  },
];

describe('searchNotes', () => {
  it('空查询返回全部', () => {
    expect(searchNotes(items, '')).toHaveLength(2);
  });

  it('按标题匹配', () => {
    const r = searchNotes(items, 'git');
    expect(r.map((x) => x.id)).toEqual(['a']);
  });

  it('按标签匹配', () => {
    const r = searchNotes(items, 'AI');
    expect(r.map((x) => x.id)).toEqual(['b']);
  });

  it('多词要求全部命中', () => {
    const r = searchNotes(items, '向量 检索');
    expect(r.map((x) => x.id)).toEqual(['b']);
  });

  it('无结果返回空数组', () => {
    expect(searchNotes(items, '不存在的词')).toEqual([]);
  });
});
