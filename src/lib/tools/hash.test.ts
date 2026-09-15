import { describe, it, expect } from 'vitest';
import { hashText, hmacText } from './hash';

describe('hashText', () => {
  it('SHA-256("abc") 是已知值', async () => {
    const r = await hashText('SHA-256', 'abc');
    expect(r).toEqual({
      ok: true,
      hex: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    });
  });

  it('uppercase 输出大写十六进制', async () => {
    const r = await hashText('SHA-256', 'abc', true);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.hex).toBe(
        'BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD'
      );
    }
  });

  it('空字符串也可哈希', async () => {
    const r = await hashText('SHA-256', '');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.hex).toHaveLength(64);
    }
  });
});

describe('hmacText', () => {
  it('HMAC-SHA256 是已知值', async () => {
    const r = await hmacText(
      'SHA-256',
      'key',
      'The quick brown fox jumps over the lazy dog'
    );
    expect(r).toEqual({
      ok: true,
      hex: 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    });
  });

  it('密钥为空时报错', async () => {
    const r = await hmacText('SHA-256', '', 'msg');
    expect(r).toEqual({ ok: false, error: 'HMAC 密钥为空' });
  });
});
