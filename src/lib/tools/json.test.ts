import { describe, it, expect } from 'vitest';
import { validateJson, formatJson, minifyJson } from './json';

describe('validateJson', () => {
  it('成功解析合法对象', () => {
    const r = validateJson('{"a":1}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toEqual({ a: 1 });
  });

  it('成功解析合法数组', () => {
    const r = validateJson('[1, 2, 3]');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toEqual([1, 2, 3]);
  });

  it('接受原始值(数字/布尔/字符串/null)', () => {
    expect(validateJson('42').ok).toBe(true);
    expect(validateJson('true').ok).toBe(true);
    expect(validateJson('null').ok).toBe(true);
    expect(validateJson('"hi"').ok).toBe(true);
  });

  it('对空输入返回错误', () => {
    const r = validateJson('');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('输入为空');
  });

  it('对纯空白输入返回错误', () => {
    const r = validateJson('   \n  ');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('输入为空');
  });

  it('对尾随逗号返回错误', () => {
    const r = validateJson('{"a":1,}');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
  });

  it('对缺引号的键返回错误', () => {
    const r = validateJson('{a:1}');
    expect(r.ok).toBe(false);
  });

  it('对单引号字符串返回错误', () => {
    const r = validateJson("{'a':1}");
    expect(r.ok).toBe(false);
  });
});

describe('formatJson', () => {
  it('用默认 2 空格缩进美化', () => {
    const r = formatJson('{"a":1,"b":2}');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.output).toBe('{\n  "a": 1,\n  "b": 2\n}');
    }
  });

  it('支持自定义缩进', () => {
    const r = formatJson('{"a":1}', 4);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toBe('{\n    "a": 1\n}');
  });

  it('压缩输入会被展开', () => {
    const r = formatJson('[1,2,3]');
    if (r.ok) expect(r.output).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('非法输入透传错误', () => {
    const r = formatJson('{bad');
    expect(r.ok).toBe(false);
  });
});

describe('minifyJson', () => {
  it('去掉所有空白', () => {
    const r = minifyJson('{\n  "a" : 1 ,\n  "b" : 2\n}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.output).toBe('{"a":1,"b":2}');
  });

  it('已是压缩态则保持', () => {
    const r = minifyJson('{"a":1}');
    if (r.ok) expect(r.output).toBe('{"a":1}');
  });

  it('非法输入透传错误', () => {
    const r = minifyJson('[1, 2,');
    expect(r.ok).toBe(false);
  });
});
