import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * 笔记可见性:
 * - 生产构建(import.meta.env.PROD):只出非 draft
 * - 本地开发(DEV):草稿也可见,方便边写边预览
 */
export function isNoteVisible(note: CollectionEntry<'notes'>): boolean {
  if (import.meta.env.PROD) return !note.data.draft;
  return true;
}

/** 可见笔记,按日期倒序 */
export async function getVisibleNotes(): Promise<CollectionEntry<'notes'>[]> {
  const notes = await getCollection('notes', isNoteVisible);
  return notes.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
