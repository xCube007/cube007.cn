import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function escapeXml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const notes = (await getCollection('notes', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  );

  const base = site?.toString().replace(/\/$/, '') ?? 'https://cube007.cn';
  const items = notes
    .map((note) => {
      const link = `${base}/notes/${note.id}/`;
      const desc = note.data.description ?? '';
      return `    <item>
      <title>${escapeXml(note.data.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${note.data.date.toUTCString()}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Cube007 · 学习笔记</title>
    <link>${base}/</link>
    <description>编程 / 后端 / AI 学习笔记与开发小工具</description>
    <language>zh-CN</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
};
