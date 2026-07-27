import { describe, it, expect } from 'vitest';
import { estimateReadingMinutes } from './reading-time';

describe('estimateReadingMinutes', () => {
  it('空文本至少 1 分钟', () => {
    expect(estimateReadingMinutes('')).toBe(1);
  });

  it('短文至少 1 分钟', () => {
    expect(estimateReadingMinutes('你好')).toBe(1);
  });

  it('中文约 300 字一分钟', () => {
    const text = '测'.repeat(600);
    expect(estimateReadingMinutes(text)).toBe(2);
  });

  it('英文按词估算', () => {
    const text = Array.from({ length: 600 }, () => 'word').join(' ');
    expect(estimateReadingMinutes(text)).toBe(2);
  });
});
