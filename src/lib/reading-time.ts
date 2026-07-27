/**
 * 阅读时长估算:按中文/英文混合粗算。
 * 中文按字,英文按词,约 300 字/分钟。
 */
export function estimateReadingMinutes(text: string): number {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 1;

  const cjk = (cleaned.match(/[一-鿿]/g) ?? []).join('').length;
  const latin = cleaned
    .replace(/[一-鿿]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

  const units = cjk + latin;
  return Math.max(1, Math.ceil(units / 300));
}
