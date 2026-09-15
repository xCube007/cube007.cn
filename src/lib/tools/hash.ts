/**
 * 哈希 / HMAC 的纯函数逻辑。与 UI 分离,可单测。
 * 用 Web Crypto,全部在浏览器(或 Node 的 global crypto)里算,不上传。
 */

export type HashAlgo = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const HASH_ALGOS: HashAlgo[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export type HashResult =
  | { ok: true; hex: string }
  | { ok: false; error: string };

export function bytesToHex(bytes: ArrayBuffer, uppercase = false): string {
  const hex = [...new Uint8Array(bytes)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return uppercase ? hex.toUpperCase() : hex;
}

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function cryptoOrThrow(): Crypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('当前环境不支持 Web Crypto');
  }
  return crypto;
}

/** 对任意字节做摘要。 */
export async function hashBytes(
  algo: HashAlgo,
  data: BufferSource,
  uppercase = false
): Promise<HashResult> {
  try {
    const buf = await cryptoOrThrow().subtle.digest(algo, data);
    return { ok: true, hex: bytesToHex(buf, uppercase) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** 对 UTF-8 文本做摘要。空字符串也允许(哈希空输入是合法需求)。 */
export async function hashText(
  algo: HashAlgo,
  text: string,
  uppercase = false
): Promise<HashResult> {
  return hashBytes(algo, encodeText(text), uppercase);
}

/** HMAC。key 与 message 都按 UTF-8 文本处理。 */
export async function hmacText(
  algo: HashAlgo,
  key: string,
  message: string,
  uppercase = false
): Promise<HashResult> {
  if (key === '') {
    return { ok: false, error: 'HMAC 密钥为空' };
  }
  try {
    const c = cryptoOrThrow();
    const cryptoKey = await c.subtle.importKey(
      'raw',
      encodeText(key),
      { name: 'HMAC', hash: algo },
      false,
      ['sign']
    );
    const sig = await c.subtle.sign('HMAC', cryptoKey, encodeText(message));
    return { ok: true, hex: bytesToHex(sig, uppercase) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
