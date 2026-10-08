import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** 幻灯片 HTML 约定:src/content/decks/<笔记 id>.html */
export function getDeckHtml(id: string): string {
  const path = join(process.cwd(), 'src/content/decks', `${id}.html`);
  if (!existsSync(path)) {
    throw new Error(`幻灯片笔记 "${id}" 缺少 src/content/decks/${id}.html`);
  }
  return readFileSync(path, 'utf8');
}
