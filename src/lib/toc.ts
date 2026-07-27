/**
 * 从 Markdown 正文提取二级标题,生成目录。
 * 只抓 ## 标题,避免目录过深。
 */

export interface TocItem {
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function extractToc(markdown: string): TocItem[] {
  if (!markdown) return [];
  const items: TocItem[] = [];
  const used = new Map<string, number>();
  const re = /^##\s+(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    const text = m[1].trim().replace(/#+$/, '').trim();
    if (!text) continue;
    let id = slugify(text) || 'section';
    const n = used.get(id) ?? 0;
    used.set(id, n + 1);
    if (n > 0) id = `${id}-${n}`;
    items.push({ text, id });
  }
  return items;
}
