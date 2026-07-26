/**
 * UUID / 密码生成工具的纯函数逻辑。与 UI 分离,可单测。
 *
 * 注意:生成函数本身是非确定性的(依赖随机数),测试只验证"形状/约束",
 * 不验证具体输出值。这跟 JSON/Base64 那种纯函数不同 —— 测试策略要跟着变。
 */

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
};

/** 生成 UUID v4(符合 RFC 4122 的十六进制格式)。 */
export function generateUuid(): string {
  // 借助 crypto.getRandomValues 取真随机;无 crypto 时回退 Math.random(测试环境)
  const random = (n: number) => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      return crypto.getRandomValues(new Uint8Array(n));
    }
    const arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  };
  const bytes = random(16);
  // v4 标志位:第 7 字节高 4 位为 0100,第 9 字节高 2 位为 10
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * 生成随机密码。
 * @throws 当所有字符集都被关闭、或长度非法时抛错(UI 调用处 try/catch)
 */
export function generatePassword(opts: PasswordOptions): string {
  const { length, lower, upper, digits, symbols } = opts;
  if (!Number.isInteger(length) || length < 1) {
    throw new Error('密码长度必须是正整数');
  }
  let pool = '';
  if (lower) pool += SETS.lower;
  if (upper) pool += SETS.upper;
  if (digits) pool += SETS.digits;
  if (symbols) pool += SETS.symbols;
  if (pool === '') {
    throw new Error('至少要选择一种字符集');
  }
  const secureRandom = (max: number): number => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0] % max;
    }
    return Math.floor(Math.random() * max);
  };
  let out = '';
  for (let i = 0; i < length; i++) {
    out += pool[secureRandom(pool.length)];
  }
  return out;
}
