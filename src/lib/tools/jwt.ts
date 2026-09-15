/**
 * JWT 解码(不校验签名)。与 UI 分离,可单测。
 *
 * 只做 Base64URL → JSON,方便看 header / payload。
 * 不验证签名、不托管密钥 —— 符合「前台零运行时后端」。
 */

export interface JwtClaims {
  exp?: number;
  iat?: number;
  nbf?: number;
  expired: boolean;
  notYetValid: boolean;
  expText?: string;
  iatText?: string;
  nbfText?: string;
}

export type JwtResult =
  | {
      ok: true;
      header: unknown;
      payload: unknown;
      headerJson: string;
      payloadJson: string;
      claims: JwtClaims;
    }
  | { ok: false; error: string };

function padB64(s: string): string {
  return s + '='.repeat((4 - (s.length % 4)) % 4);
}

function decodePart(part: string): unknown {
  const b64 = padB64(part.replace(/-/g, '+').replace(/_/g, '/'));
  const latin1 = atob(b64);
  const bytes = new Uint8Array(latin1.length);
  for (let i = 0; i < latin1.length; i++) bytes[i] = latin1.charCodeAt(i);
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text);
}

function fmtTs(n: unknown): string | undefined {
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  const d = new Date(n * 1000);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

/**
 * @param token 完整 JWT 字符串
 * @param nowMs 当前时间,便于单测过期判断
 */
export function decodeJwt(token: string, nowMs = Date.now()): JwtResult {
  const trimmed = token.trim();
  if (trimmed === '') {
    return { ok: false, error: '输入为空' };
  }

  const parts = trimmed.split('.');
  if (parts.length < 2 || parts.length > 3) {
    return { ok: false, error: '不是合法的 JWT(需要 header.payload[.signature])' };
  }
  if (!parts[0] || !parts[1]) {
    return { ok: false, error: 'JWT 缺少 header 或 payload' };
  }

  let header: unknown;
  let payload: unknown;
  try {
    header = decodePart(parts[0]);
  } catch {
    return { ok: false, error: 'header 不是合法的 Base64URL JSON' };
  }
  try {
    payload = decodePart(parts[1]);
  } catch {
    return { ok: false, error: 'payload 不是合法的 Base64URL JSON' };
  }

  const obj = asObject(payload) ?? {};
  const exp = typeof obj.exp === 'number' ? obj.exp : undefined;
  const iat = typeof obj.iat === 'number' ? obj.iat : undefined;
  const nbf = typeof obj.nbf === 'number' ? obj.nbf : undefined;
  const nowSec = nowMs / 1000;

  const claims: JwtClaims = {
    exp,
    iat,
    nbf,
    expired: exp !== undefined && exp < nowSec,
    notYetValid: nbf !== undefined && nbf > nowSec,
    expText: fmtTs(exp),
    iatText: fmtTs(iat),
    nbfText: fmtTs(nbf),
  };

  return {
    ok: true,
    header,
    payload,
    headerJson: JSON.stringify(header, null, 2),
    payloadJson: JSON.stringify(payload, null, 2),
    claims,
  };
}

/** 页面「填入示例」用的演示 token,无签名意义。 */
export const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjdWJlMDA3IiwibmFtZSI6IkN1YmUwMDciLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6NDEwMjQ0NDgwMH0.example';
