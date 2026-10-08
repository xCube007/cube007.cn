import { describe, it, expect } from 'vitest';
import { getDeckHtml } from './decks';

describe('getDeckHtml', () => {
  it('读得到 intro-redis 幻灯片', () => {
    const html = getDeckHtml('intro-redis');
    expect(html).toContain('id="stage"');
    expect(html).toContain('class="slide"');
    expect(html).toContain('REDIS');
  });

  it('缺文件就抛错', () => {
    expect(() => getDeckHtml('does-not-exist')).toThrow(/does-not-exist/);
  });
});
