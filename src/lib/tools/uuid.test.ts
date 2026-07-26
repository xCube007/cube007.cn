import { describe, it, expect } from 'vitest';
import { generateUuid, generatePassword } from './uuid';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('generateUuid', () => {
  it('生成符合 v4 格式的 UUID', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateUuid()).toMatch(UUID_RE);
    }
  });

  it('多次生成结果几乎必然不同', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(generateUuid());
    // 1000 个 v4 UUID 碰撞概率可忽略
    expect(set.size).toBe(1000);
  });
});

describe('generatePassword', () => {
  it('生成长度正确的密码', () => {
    const p = generatePassword({ length: 24, lower: true, upper: false, digits: false, symbols: false });
    expect(p.length).toBe(24);
  });

  it('只开小写时全是小写字母', () => {
    const p = generatePassword({ length: 50, lower: true, upper: false, digits: false, symbols: false });
    expect(p).toMatch(/^[a-z]+$/);
  });

  it('全开时包含各种字符', () => {
    const p = generatePassword({ length: 200, lower: true, upper: true, digits: true, symbols: true });
    expect(/[a-z]/.test(p)).toBe(true);
    expect(/[A-Z]/.test(p)).toBe(true);
    expect(/[0-9]/.test(p)).toBe(true);
    expect(/[!@#$%^&*()\-_=+\[\]{};:,.<>?]/.test(p)).toBe(true);
  });

  it('长度非法抛错', () => {
    expect(() =>
      generatePassword({ length: 0, lower: true, upper: false, digits: false, symbols: false })
    ).toThrow();
    expect(() =>
      generatePassword({ length: -5, lower: true, upper: false, digits: false, symbols: false })
    ).toThrow();
  });

  it('所有字符集都关闭时抛错', () => {
    expect(() =>
      generatePassword({ length: 10, lower: false, upper: false, digits: false, symbols: false })
    ).toThrow();
  });
});
