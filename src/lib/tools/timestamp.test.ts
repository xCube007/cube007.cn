import { describe, it, expect } from 'vitest';
import {
  timestampToDate,
  dateToTimestamp,
  isMilliseconds,
  normalizeToMs,
} from './timestamp';

describe('isMilliseconds / normalizeToMs', () => {
  it('小于 1e12 视为秒', () => {
    expect(isMilliseconds(1700000000)).toBe(false);
  });
  it('大于等于 1e12 视为毫秒', () => {
    expect(isMilliseconds(1700000000000)).toBe(true);
  });
  it('秒级归一化为毫秒', () => {
    expect(normalizeToMs(1700000000)).toBe(1700000000000);
  });
  it('毫秒级保持不变', () => {
    expect(normalizeToMs(1700000000000)).toBe(1700000000000);
  });
  it('负时间戳(1970 前)也正确归一化', () => {
    expect(normalizeToMs(-1000)).toBe(-1_000_000);
  });
});

describe('timestampToDate', () => {
  it('秒级时间戳转日期(东八区)', () => {
    const r = timestampToDate(1700000000);
    if (r.ok) expect(r.output).toBe('2023-11-15 06:13:20');
  });
  it('毫秒级时间戳转日期(东八区)', () => {
    const r = timestampToDate(1700000000000);
    if (r.ok) expect(r.output).toBe('2023-11-15 06:13:20');
  });
  it('UTC 时区', () => {
    const r = timestampToDate(1700000000, 0);
    if (r.ok) expect(r.output).toBe('2023-11-14 22:13:20');
  });
  it('非数字返回错误', () => {
    const r = timestampToDate(NaN);
    expect(r.ok).toBe(false);
  });
});

describe('dateToTimestamp', () => {
  it('日期字符串转时间戳', () => {
    const r = dateToTimestamp('2023-11-15 06:13:20');
    if (r.ok) {
      expect(r.output.seconds).toBe(1700000000);
      expect(r.output.ms).toBe(1700000000000);
    }
  });
  it('纯日期也能解析', () => {
    const r = dateToTimestamp('2023-11-15');
    expect(r.ok).toBe(true);
  });
  it('空输入返回错误', () => {
    expect(dateToTimestamp('').ok).toBe(false);
  });
  it('非法日期返回错误', () => {
    const r = dateToTimestamp('不是日期');
    expect(r.ok).toBe(false);
  });
});
