/**
 * 纯文本工具:URL 编解码。
 * 用 encodeURIComponent / decodeURIComponent,覆盖查询串与 path 片段常见场景。
 */

export type UrlCodecResult =
  | { ok: true; output: string }
  | { ok: false; error: string };

/** 编码为 URL 安全字符串(空格 → %20 等)。 */
export function encodeUrl(input: string): UrlCodecResult {
  if (input === '') {
    return { ok: false, error: '输入为空' };
  }
  try {
    return { ok: true, output: encodeURIComponent(input) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** 解码 URL 编码字符串。 */
export function decodeUrl(input: string): UrlCodecResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: '输入为空' };
  }
  try {
    return { ok: true, output: decodeURIComponent(trimmed) };
  } catch {
    return { ok: false, error: '不是合法的 URL 编码字符串' };
  }
}
