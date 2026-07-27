import { describe, it, expect } from 'vitest';
import { extractToc } from './toc';

describe('extractToc', () => {
  it('空文本返回空', () => {
    expect(extractToc('')).toEqual([]);
  });

  it('提取二级标题', () => {
    const md = `# 标题\n\n## 第一段\n内容\n\n## 第二段\n更多`;
    expect(extractToc(md)).toEqual([
      { text: '第一段', id: '第一段' },
      { text: '第二段', id: '第二段' },
    ]);
  });

  it('忽略三级标题', () => {
    const md = '## A\n### B\n## C';
    expect(extractToc(md).map((x) => x.text)).toEqual(['A', 'C']);
  });

  it('重复标题加后缀', () => {
    const md = '## 重复\n## 重复';
    const toc = extractToc(md);
    expect(toc[0].id).toBe('重复');
    expect(toc[1].id).toBe('重复-1');
  });
});
