/**
 * 客户端搜索:对标题/描述/标签做简单子串匹配。
 * 索引在构建时生成,运行时纯前端过滤。
 */

export type SearchKind = 'note' | 'tool';

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  date?: string;
  href: string;
  kind?: SearchKind;
}

export function searchNotes(items: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const tokens = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const kindLabel = item.kind === 'tool' ? '工具 tool' : '笔记 note';
    const hay = [item.title, item.description, ...item.tags, kindLabel]
      .join(' ')
      .toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 把查询词高亮成 <mark>,同时转义原文,避免 XSS。 */
export function highlightHtml(text: string, query: string): string {
  const tokens = [
    ...new Set(
      query
        .trim()
        .split(/\s+/)
        .filter((t) => t.length > 0)
    ),
  ].sort((a, b) => b.length - a.length);

  if (tokens.length === 0) return escapeHtml(text);

  const re = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  return text
    .split(re)
    .map((part) => {
      const hit = tokens.some((t) => part.toLowerCase() === t.toLowerCase());
      return hit ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part);
    })
    .join('');
}
