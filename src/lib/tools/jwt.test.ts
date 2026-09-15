import { describe, it, expect } from 'vitest';
import { decodeJwt, SAMPLE_JWT } from './jwt';

const NOW = Date.parse('2026-09-15T00:00:00Z');

describe('decodeJwt', () => {
  it('空输入报错', () => {
    expect(decodeJwt('')).toEqual({ ok: false, error: '输入为空' });
  });

  it('段数不对报错', () => {
    const r = decodeJwt('only-one-part');
    expect(r.ok).toBe(false);
  });

  it('解码示例 token 的 header 与 payload', () => {
    const r = decodeJwt(SAMPLE_JWT, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(r.payload).toEqual({
      sub: 'cube007',
      name: 'Cube007',
      iat: 1700000000,
      exp: 4102444800,
    });
    expect(r.claims.expired).toBe(false);
    expect(r.claims.iatText).toBe('2023-11-14 22:13:20 UTC');
  });

  it('过期 token 标 expired', () => {
    // header {"alg":"none"} payload {"exp":1}
    const token = 'eyJhbGciOiJub25lIn0.eyJleHAiOjF9.x';
    const r = decodeJwt(token, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.claims.expired).toBe(true);
    expect(r.claims.exp).toBe(1);
  });

  it('nbf 在未来时标 notYetValid', () => {
    const token = 'eyJhbGciOiJub25lIn0.eyJuYmYiOjk5OTk5OTk5OTl9.x';
    const r = decodeJwt(token, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.claims.notYetValid).toBe(true);
  });
});
