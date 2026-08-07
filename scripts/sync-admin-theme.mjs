#!/usr/bin/env node
/**
 * 把站点样式同步到写作后台。
 *
 * 前台样式走 Astro 打包(文件名带 hash,拿不到稳定 URL),而 public/admin/
 * 是原样复制的静态目录,两边够不着同一个文件。所以这里在 dev/build 之前
 * 生成两份:
 *
 *   public/admin/tokens.css   设计 token 原样复制,给后台 UI 覆盖 --sui-* 用
 *   public/admin/preview.css  token + 正文排版(剥掉容器前缀),喂给
 *                             CMS.registerPreviewStyle
 *
 * 生成物已 gitignore —— 唯一事实来源始终是 src/styles/ 下那两个文件。
 *
 * 用法: npm run sync:admin-theme(dev / build 会自动跑)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPreviewCss } from './admin-theme.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stylesDir = join(root, 'src', 'styles');
const outDir = join(root, 'public', 'admin');

const BANNER = '/* 自动生成,勿手改 —— 改 src/styles/,再跑 npm run sync:admin-theme */';

function read(name) {
  try {
    return readFileSync(join(stylesDir, name), 'utf8');
  } catch {
    console.error(`找不到 src/styles/${name},后台主题无法生成`);
    process.exit(1);
  }
}

const tokensCss = read('tokens.css');
const proseCss = read('prose.css');

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'tokens.css'), `${BANNER}\n${tokensCss}`, 'utf8');
writeFileSync(join(outDir, 'preview.css'), buildPreviewCss(tokensCss, proseCss), 'utf8');

console.log('已同步后台主题: public/admin/tokens.css, public/admin/preview.css');
