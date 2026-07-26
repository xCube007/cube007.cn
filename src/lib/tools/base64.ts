/**
 * Base64 工具的纯函数逻辑。与 UI 分离,可单测。
 *
 * 关键点:用 TextEncoder/TextDecoder 正确处理 UTF-8。
 * 原生 btoa/atob 只认 Latin-1,遇到中文/emoji 会炸 —— 这是 Base64 工具最常见的坑。
 * 这里通过"字节串"中转,让中文也能正确编解码。
 */

export type B64Result =
  | { ok: true; output: string }
  | { ok: false; error: string };

/** 字节 ↔ Latin-1 字符串互转,作为 btoa/atob 与 Uint8Array 的桥梁 */
function bytesToLatin1(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return s;
}
function latin1ToBytes(s: string): Uint8Array {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes;
}

/** 编码任意字符串(含中文/emoji)为 Base64。 */
export function encodeBase64(input: string): B64Result {
  if (input === '') {
    return { ok: false, error: '输入为空' };
  }
  try {
    const bytes = new TextEncoder().encode(input);
    return { ok: true, output: btoa(bytesToLatin1(bytes)) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** 解码 Base64 回字符串(支持 UTF-8)。 */
export function decodeBase64(input: string): B64Result {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: '输入为空' };
  }
  try {
    const latin1 = atob(trimmed);
    const bytes = latin1ToBytes(latin1);
    return { ok: true, output: new TextDecoder().decode(bytes) };
  } catch (e) {
    return { ok: false, error: '不是合法的 Base64 字符串' };
  }
}
