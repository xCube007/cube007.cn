#!/usr/bin/env node
/**
 * 从 templates/note.md 生成一篇草稿笔记。
 *
 * 用法:
 *   npm run new:note -- 我的笔记标题
 *   npm run new:note -- 我的笔记标题 my-custom-slug
 *
 * 生成到 src/content/notes/<slug>.md,默认 draft: true。
 * 本地 npm run dev 可见;npm run build / 线上不会发布。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const templatePath = join(root, 'templates', 'note.md');
const outDir = join(root, 'src', 'content', 'notes');

const args = process.argv.slice(2).filter((a) => a !== '--');
const title = args[0];
const customSlug = args[1];

if (!title) {
  console.error('用法: npm run new:note -- "笔记标题" [可选-slug]');
  process.exit(1);
}

function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'note';
}

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const date = `${yyyy}-${mm}-${dd}`;

const slug = customSlug ? slugify(customSlug) : slugify(title);
const outPath = join(outDir, `${slug}.md`);

if (existsSync(outPath)) {
  console.error(`已存在: src/content/notes/${slug}.md`);
  process.exit(1);
}

if (!existsSync(templatePath)) {
  console.error('找不到 templates/note.md');
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const tpl = readFileSync(templatePath, 'utf8');
const content = tpl
  .replaceAll('{{DATE}}', date)
  .replace("title: '笔记标题'", `title: ${JSON.stringify(title)}`);

writeFileSync(outPath, content, 'utf8');
console.log(`已创建草稿: src/content/notes/${slug}.md`);
console.log('本地预览: npm run dev  →  首页可见(带草稿标记)');
console.log('发布: 把 frontmatter 里 draft: true 改成 false(或删掉),再 commit + push');
