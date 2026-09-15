import { describe, it, expect } from 'vitest';
import { buildPalette, filterPalette } from './palette';

const items = buildPalette({
  tools: [{ name: 'JSON 格式化', slug: 'json-formatter', desc: '格式化 JSON' }],
  notes: [{ title: 'Git rebase 与 merge', href: '/notes/git/', hint: '编程 Git' }],
});

describe('buildPalette', () => {
  it('固定包含页面入口,再接工具和笔记', () => {
    expect(items.some((i) => i.kind === '页面' && i.href === '/')).toBe(true);
    expect(items.some((i) => i.kind === '工具' && i.href === '/tools/json-formatter/')).toBe(
      true
    );
    expect(items.some((i) => i.kind === '笔记' && i.href === '/notes/git/')).toBe(true);
  });
});

describe('filterPalette', () => {
  it('空查询返回全部', () => {
    expect(filterPalette(items, '  ')).toEqual(items);
  });

  it('按工具名匹配', () => {
    const r = filterPalette(items, 'json');
    expect(r.map((x) => x.href)).toEqual(['/tools/json-formatter/']);
  });

  it('按笔记标签提示匹配', () => {
    const r = filterPalette(items, 'Git');
    expect(r.map((x) => x.href)).toEqual(['/notes/git/']);
  });

  it('多词要求全部命中', () => {
    expect(filterPalette(items, '笔记 rebase').map((x) => x.href)).toEqual([
      '/notes/git/',
    ]);
  });

  it('无结果返回空数组', () => {
    expect(filterPalette(items, '不存在的词')).toEqual([]);
  });
});
