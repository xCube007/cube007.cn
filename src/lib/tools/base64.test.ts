import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64 } from './base64';

describe('encodeBase64', () => {
  it('编码 ASCII 字符串', () => {
    const r = encodeBase64('hello');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toBe('aGVsbG8=');
  });

  it('编码中文(UTF-8 关键:原生 btoa 会炸)', () => {
    const r = encodeBase64('你好');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toBe('5L2g5aW9');
  });

  it('编码 emoji', () => {
    const r = encodeBase64('🚀');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toBe('8J+agA==');
  });

  it('空输入返回错误', () => {
    expect(encodeBase64('').ok).toBe(false);
  });
});

describe('decodeBase64', () => {
  it('解码 ASCII', () => {
    const r = decodeBase64('aGVsbG8=');
    if (r.ok) expect(r.output).toBe('hello');
  });

  it('解码中文(UTF-8 往返)', () => {
    const r = decodeBase64('5L2g5aW9');
    if (r.ok) expect(r.output).toBe('你好');
  });

  it('空输入返回错误', () => {
    expect(decodeBase64('').ok).toBe(false);
  });

  it('非法 Base64 返回错误', () => {
    const r = decodeBase64('!!!不是base64!!!');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });
});

describe('往返一致性', () => {
  it('encode 再 decode 还原原文(含中文+emoji)', () => {
    const original = '编程 / 后端 / AI 🤖 — cube007';
    const enc = encodeBase64(original);
    if (!enc.ok) throw new Error('encode failed');
    const dec = decodeBase64(enc.output);
    if (!dec.ok) throw new Error('decode failed');
    expect(dec.output).toBe(original);
  });
});
