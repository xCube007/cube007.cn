import { describe, it, expect } from 'vitest';
import { testRegex, validateFlags } from './regex';

describe('validateFlags', () => {
  it('空 flags 合法', () => {
    expect(validateFlags('').ok).toBe(true);
  });
  it('常见组合合法', () => {
    expect(validateFlags('gim').ok).toBe(true);
  });
  it('非法字符报错', () => {
    const r = validateFlags('gx');
    expect(r.ok).toBe(false);
  });
  it('重复 flag 报错', () => {
    const r = validateFlags('ii');
    expect(r.ok).toBe(false);
  });
});

describe('testRegex', () => {
  it('空 pattern 报错', () => {
    expect(testRegex('', 'g', 'abc').ok).toBe(false);
  });

  it('非法 pattern 报错', () => {
    const r = testRegex('(', 'g', 'abc');
    expect(r.ok).toBe(false);
  });

  it('无 g 时只返回第一个匹配', () => {
    const r = testRegex('\\d+', '', 'a12b34');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.count).toBe(1);
      expect(r.matches[0].match).toBe('12');
      expect(r.matches[0].index).toBe(1);
    }
  });

  it('有 g 时返回全部匹配', () => {
    const r = testRegex('\\d+', 'g', 'a12b34');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.count).toBe(2);
      expect(r.matches.map((m) => m.match)).toEqual(['12', '34']);
    }
  });

  it('捕获组', () => {
    const r = testRegex('(\\w+)@(\\w+)', '', 'a@b.com');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.matches[0].groups).toEqual(['a', 'b']);
    }
  });

  it('无匹配返回空列表', () => {
    const r = testRegex('zzz', 'g', 'hello');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.count).toBe(0);
  });

  it('忽略大小写', () => {
    const r = testRegex('hi', 'i', 'Hi there');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.matches[0].match).toBe('Hi');
  });
});
