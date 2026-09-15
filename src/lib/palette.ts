/**
 * 全站快捷搜索(命令面板)的数据与过滤。
 * 纯函数,便于单测;BaseLayout 只负责渲染。
 */

export type PaletteKind = '笔记' | '工具' | '页面';

export interface PaletteItem {
  kind: PaletteKind;
  title: string;
  href: string;
  hint?: string;
}

const PAGES: PaletteItem[] = [
  { kind: '页面', title: '笔记时间流', href: '/', hint: '首页 笔记' },
  { kind: '页面', title: '标签', href: '/tags/', hint: '分类' },
  { kind: '页面', title: '工具', href: '/tools/', hint: '开发小工具' },
  { kind: '页面', title: '搜索', href: '/search/', hint: '查找笔记' },
  { kind: '页面', title: '关于', href: '/about/' },
];

export function buildPalette(opts: {
  notes: Array<{ title: string; href: string; hint?: string }>;
  tools: Array<{ name: string; slug: string; desc: string }>;
}): PaletteItem[] {
  const tools: PaletteItem[] = opts.tools.map((t) => ({
    kind: '工具',
    title: t.name,
    href: `/tools/${t.slug}/`,
    hint: t.desc,
  }));
  const notes: PaletteItem[] = opts.notes.map((n) => ({
    kind: '笔记',
    title: n.title,
    href: n.href,
    hint: n.hint,
  }));
  return [...PAGES, ...tools, ...notes];
}

/** 按标题 / 提示 / 路径 / 种类做多词 AND 子串匹配。空查询返回全部。 */
export function filterPalette(items: PaletteItem[], query: string): PaletteItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const tokens = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const hay = [item.kind, item.title, item.hint ?? '', item.href]
      .join(' ')
      .toLowerCase();
    return tokens.every((t) => hay.includes(t));
  });
}
