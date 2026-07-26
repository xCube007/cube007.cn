import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 笔记 collection:统一时间流 + 标签的唯一来源。
// Astro 7 Content Layer API:用 glob loader 从文件加载。
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    description: z.string().optional(),
  }),
});

export const collections = { notes };
