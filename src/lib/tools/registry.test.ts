import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tools, toolsSummary } from './registry';

const toolPagesDir = fileURLToPath(new URL('../../pages/tools/', import.meta.url));

/** src/pages/tools/ 下的每个子目录就是一个已上线的工具页 */
function shippedToolSlugs(): string[] {
  return readdirSync(toolPagesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

describe('工具注册表', () => {
  // 这条是本文件存在的理由:首页和工具页都从注册表渲染,
  // 只要新工具漏登记,这里先红,而不是等首页悄悄少一个入口。
  it('每个已上线的工具页都在注册表里', () => {
    const registered = tools.map((t) => t.slug).sort();
    expect(registered).toEqual(shippedToolSlugs());
  });

  it('注册表里没有指向不存在页面的条目', () => {
    const shipped = new Set(shippedToolSlugs());
    const dangling = tools.filter((t) => !shipped.has(t.slug));
    expect(dangling).toEqual([]);
  });

  it('slug 不重复', () => {
    const slugs = tools.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('每个条目都有名称、短名和描述', () => {
    for (const t of tools) {
      expect(t.name, `${t.slug} 缺 name`).toBeTruthy();
      expect(t.short, `${t.slug} 缺 short`).toBeTruthy();
      expect(t.desc, `${t.slug} 缺 desc`).toBeTruthy();
    }
  });
});

describe('toolsSummary', () => {
  it('把所有短名连成一句话,新增工具会自动出现在里面', () => {
    const summary = toolsSummary();
    for (const t of tools) {
      expect(summary).toContain(t.short);
    }
  });
});
