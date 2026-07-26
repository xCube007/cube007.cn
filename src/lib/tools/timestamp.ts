/**
 * 时间戳工具的纯函数逻辑。与 UI 分离,可单测。
 *
 * 关键点:自动区分秒与毫秒。Unix 时间戳有秒和毫秒两种习惯,
 * 边界是 1e12(秒级时间戳在 2001 年才到 1e12,毫秒级在 1970 就过了)。
 * 小于 1e12 当秒,大于等于当毫秒。
 */

export type TsResult<T = string> =
  | { ok: true; output: T }
  | { ok: false; error: string };

const MS_THRESHOLD = 1e12; // 13 位以上视为毫秒

/** 把任意时间戳(秒或毫秒)归一化为毫秒数。 */
export function normalizeToMs(ts: number): number {
  return Math.abs(ts) >= MS_THRESHOLD ? ts : ts * 1000;
}

/** 判断一个时间戳按秒还是毫秒解释 */
export function isMilliseconds(ts: number): boolean {
  return Math.abs(ts) >= MS_THRESHOLD;
}

/**
 * 时间戳 → 可读日期字符串。
 * @param tzHourOffset 时区偏移小时数,默认 8(东八区)。0 = UTC。
 */
export function timestampToDate(
  ts: number,
  tzHourOffset = 8
): TsResult<string> {
  if (!Number.isFinite(ts)) {
    return { ok: false, error: '不是合法数字' };
  }
  const ms = normalizeToMs(ts);
  const date = new Date(ms + tzHourOffset * 3600_000);
  const iso = date.toISOString();
  // 去掉毫秒和 Z,留 YYYY-MM-DD HH:mm:ss
  return { ok: true, output: iso.slice(0, 19).replace('T', ' ') };
}

/** 当前时间戳(秒)。UI 调用,测试不依赖。 */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
/** 当前时间戳(毫秒)。 */
export function nowMs(): number {
  return Date.now();
}

/**
 * 日期字符串 → 时间戳(秒和毫秒都给)。
 * 接受 "YYYY-MM-DD"、"YYYY-MM-DD HH:mm:ss" 或任何 Date 能解析的格式。
 */
export function dateToTimestamp(input: string): TsResult<{ seconds: number; ms: number }> {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: '输入为空' };
  }
  const date = new Date(trimmed.replace(' ', 'T'));
  if (isNaN(date.getTime())) {
    return { ok: false, error: '无法解析日期,试试 YYYY-MM-DD 或 YYYY-MM-DD HH:mm:ss' };
  }
  const ms = date.getTime();
  return { ok: true, output: { seconds: Math.floor(ms / 1000), ms } };
}
