import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl } from './url';

describe('encodeUrl', () => {
  it('编码中文与空格', () => {
    const r = encodeUrl('你好 world');
    expect(r).toEqual({ ok: true, output: encodeURIComponent('你好 world') });
  });

  it('空输入返回错误', () => {
    expect(encodeUrl('').ok).toBe(false);
  });

  it('编码特殊符号', () => {
    const r = encodeUrl('a=1&b=2');
    if (r.ok) expect(r.output).toBe('a%3D1%26b%3D2');
  });
});

describe('decodeUrl', () => {
  it('解码中文', () => {
    const r = decodeUrl('%E4%BD%A0%E5%A5%BD');
    expect(r).toEqual({ ok: true, output: '你好' });
  });

  it('空输入返回错误', () => {
    expect(decodeUrl('').ok).toBe(false);
  });

  it('非法百分号序列返回错误', () => {
    const r = decodeUrl('%E0%A4%A');
    expect(r.ok).toBe(false);
  });
});

describe('往返一致性', () => {
  it('encode 再 decode 还原原文', () => {
    const original = '编程 / 后端 / AI?x=1&y=中文';
    const enc = encodeUrl(original);
    if (!enc.ok) throw new Error('encode failed');
    const dec = decodeUrl(enc.output);
    if (!dec.ok) throw new Error('decode failed');
    expect(dec.output).toBe(original);
  });
});
