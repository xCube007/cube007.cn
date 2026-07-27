/**
 * 相关笔记推荐:按标签重合数排序,同分按日期新→旧。
 * 纯函数,便于单测;页面只负责渲染。
 */

export interface RelatedNoteInput {
  id: string;
  title: string;
  tags: string[];
  date: Date | string | number;
  description?: string;
}

export interface RelatedNotePick {
  id: string;
  title: string;
  tags: string[];
  sharedTags: string[];
  score: number;
}

/**
 * @param current 当前笔记
 * @param candidates 候选集(通常已排除 draft)
 * @param limit 最多返回几条,默认 3
 */
export function findRelatedNotes(
  current: RelatedNoteInput,
  candidates: RelatedNoteInput[],
  limit = 3
): RelatedNotePick[] {
  const currentTags = new Set(current.tags);
  if (currentTags.size === 0 || limit <= 0) return [];

  const scored = candidates
    .filter((c) => c.id !== current.id)
    .map((c) => {
      const sharedTags = c.tags.filter((t) => currentTags.has(t));
      return {
        id: c.id,
        title: c.title,
        tags: c.tags,
        sharedTags,
        score: sharedTags.length,
        dateMs: toMs(c.date),
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.dateMs - a.dateMs;
    })
    .slice(0, limit);

  return scored.map(({ id, title, tags, sharedTags, score }) => ({
    id,
    title,
    tags,
    sharedTags,
    score,
  }));
}

function toMs(date: Date | string | number): number {
  if (date instanceof Date) return date.getTime();
  if (typeof date === 'number') return date;
  const t = Date.parse(date);
  return Number.isNaN(t) ? 0 : t;
}
