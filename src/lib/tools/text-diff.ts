/**
 * 文本对比纯函数逻辑。与 UI 完全分离,可单测。
 * 左/右无新旧语义;行级对齐 + 行内按字符高亮。
 */

import { diffArrays, diffChars } from 'diff';

export type DiffSegment = {
  text: string;
  highlight: boolean;
};

export type DiffLine = {
  /** 该侧真实行号;占位空行时为 null */
  lineNumber: number | null;
  kind: 'same' | 'only' | 'changed' | 'empty';
  segments: DiffSegment[];
};

export type CompareResult = {
  left: DiffLine[];
  right: DiffLine[];
};

/** 统一换行后再按行切开(保留末尾空行语义)。 */
function normalizeLines(input: string): string[] {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

function plainSegments(text: string): DiffSegment[] {
  return text === '' ? [] : [{ text, highlight: false }];
}

function charSegments(left: string, right: string): {
  left: DiffSegment[];
  right: DiffSegment[];
} {
  const parts = diffChars(left, right);
  const leftSegs: DiffSegment[] = [];
  const rightSegs: DiffSegment[] = [];
  for (const part of parts) {
    if (part.added) {
      rightSegs.push({ text: part.value, highlight: true });
    } else if (part.removed) {
      leftSegs.push({ text: part.value, highlight: true });
    } else {
      leftSegs.push({ text: part.value, highlight: false });
      rightSegs.push({ text: part.value, highlight: false });
    }
  }
  return { left: leftSegs, right: rightSegs };
}

/**
 * 对比两段文本,返回左右行列表。
 * 一侧缺行时对侧用 kind=empty 占位(供对齐渲染);当前输入框 UI 会过滤占位行。
 */
export function compareText(left: string, right: string): CompareResult {
  const leftLines = normalizeLines(left);
  const rightLines = normalizeLines(right);
  const changes = diffArrays(leftLines, rightLines);

  const outLeft: DiffLine[] = [];
  const outRight: DiffLine[] = [];
  let leftNo = 0;
  let rightNo = 0;

  let i = 0;
  while (i < changes.length) {
    const cur = changes[i]!;
    const next = changes[i + 1];

    if (!cur.added && !cur.removed) {
      for (const line of cur.value) {
        leftNo += 1;
        rightNo += 1;
        outLeft.push({
          lineNumber: leftNo,
          kind: 'same',
          segments: plainSegments(line),
        });
        outRight.push({
          lineNumber: rightNo,
          kind: 'same',
          segments: plainSegments(line),
        });
      }
      i += 1;
      continue;
    }

    // 连续的「仅左」+「仅右」配对成 changed(行内字符 diff)
    if (cur.removed && next?.added) {
      const removed = cur.value;
      const added = next.value;
      const paired = Math.min(removed.length, added.length);
      for (let k = 0; k < paired; k += 1) {
        leftNo += 1;
        rightNo += 1;
        const segs = charSegments(removed[k]!, added[k]!);
        outLeft.push({
          lineNumber: leftNo,
          kind: 'changed',
          segments: segs.left,
        });
        outRight.push({
          lineNumber: rightNo,
          kind: 'changed',
          segments: segs.right,
        });
      }
      for (let k = paired; k < removed.length; k += 1) {
        leftNo += 1;
        outLeft.push({
          lineNumber: leftNo,
          kind: 'only',
          segments: plainSegments(removed[k]!),
        });
        outRight.push({ lineNumber: null, kind: 'empty', segments: [] });
      }
      for (let k = paired; k < added.length; k += 1) {
        rightNo += 1;
        outLeft.push({ lineNumber: null, kind: 'empty', segments: [] });
        outRight.push({
          lineNumber: rightNo,
          kind: 'only',
          segments: plainSegments(added[k]!),
        });
      }
      i += 2;
      continue;
    }

    if (cur.removed) {
      for (const line of cur.value) {
        leftNo += 1;
        outLeft.push({
          lineNumber: leftNo,
          kind: 'only',
          segments: plainSegments(line),
        });
        outRight.push({ lineNumber: null, kind: 'empty', segments: [] });
      }
      i += 1;
      continue;
    }

    // cur.added
    for (const line of cur.value) {
      rightNo += 1;
      outLeft.push({ lineNumber: null, kind: 'empty', segments: [] });
      outRight.push({
        lineNumber: rightNo,
        kind: 'only',
        segments: plainSegments(line),
      });
    }
    i += 1;
  }

  return { left: outLeft, right: outRight };
}
