/**
 * 客户端搜索:对标题/描述/标签做简单子串匹配。
 * 索引在构建时生成,运行时纯前端过滤。
 */

export interface SearchItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
  href: string;
}

export function searchNotes(items: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const tokens = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const hay = [item.title, item.description, ...item.tags]
      .join(' ')
      .toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}
