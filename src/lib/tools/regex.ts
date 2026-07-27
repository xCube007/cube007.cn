/**
 * 正则测试器纯函数逻辑。与 UI 分离,可单测。
 *
 * 设计:不抛异常,统一返回结果对象。flags 非法时给出可读错误。
 */

export type RegexResult =
  | {
      ok: true;
      matches: Array<{
        match: string;
        index: number;
        groups: string[];
      }>;
      count: number;
    }
  | { ok: false; error: string };

const VALID_FLAGS = new Set(['d', 'g', 'i', 'm', 's', 'u', 'v', 'y']);

/** 校验 flags 字符串,只允许合法字符且不重复。 */
export function validateFlags(flags: string): { ok: true } | { ok: false; error: string } {
  if (flags === '') return { ok: true };
  const seen = new Set<string>();
  for (const ch of flags) {
    if (!VALID_FLAGS.has(ch)) {
      return { ok: false, error: `非法 flag: ${ch}` };
    }
    if (seen.has(ch)) {
      return { ok: false, error: `重复 flag: ${ch}` };
    }
    seen.add(ch);
  }
  return { ok: true };
}

/**
 * 用 pattern + flags 在 text 上找全部匹配。
 * 没有 g 时最多返回 1 条;有 g 时返回全部。
 */
export function testRegex(pattern: string, flags: string, text: string): RegexResult {
  if (pattern === '') {
    return { ok: false, error: '正则表达式为空' };
  }
  const flagCheck = validateFlags(flags);
  if (!flagCheck.ok) return flagCheck;

  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  const matches: Array<{ match: string; index: number; groups: string[] }> = [];

  if (re.global) {
    let m: RegExpExecArray | null;
    // 防止零宽匹配死循环
    let guard = 0;
    while ((m = re.exec(text)) !== null) {
      matches.push({
        match: m[0],
        index: m.index,
        groups: m.slice(1),
      });
      if (m[0] === '') {
        re.lastIndex += 1;
      }
      guard += 1;
      if (guard > 10_000) {
        return { ok: false, error: '匹配次数过多,请检查是否零宽匹配' };
      }
    }
  } else {
    const m = re.exec(text);
    if (m) {
      matches.push({
        match: m[0],
        index: m.index,
        groups: m.slice(1),
      });
    }
  }

  return { ok: true, matches, count: matches.length };
}
