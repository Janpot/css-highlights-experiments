import type { RangesData } from './rangesCodec';

export interface Segment {
  text: string;
  cls: string | null;
}

export function segmentsFromRanges(code: string, ranges: RangesData): Segment[] {
  const triples: Array<{ from: number; to: number; cls: string }> = [];
  const { classes, tokens } = ranges;
  let i = 0;
  while (i < tokens.length) {
    const classIdx = tokens[i++];
    const pairCount = tokens[i++];
    const cls = classes[classIdx];
    let prev = 0;
    for (let p = 0; p < pairCount; p++) {
      const delta = tokens[i++];
      const len = tokens[i++];
      const from = prev + delta;
      triples.push({ from, to: from + len, cls });
      prev = from;
    }
  }
  triples.sort((a, b) => a.from - b.from);

  const out: Segment[] = [];
  let cursor = 0;
  for (const { from, to, cls } of triples) {
    if (from > cursor) out.push({ text: code.slice(cursor, from), cls: null });
    out.push({ text: code.slice(from, to), cls });
    cursor = to;
  }
  if (cursor < code.length) out.push({ text: code.slice(cursor), cls: null });
  return out;
}

export function escapeHtml(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c === 0x26) out += '&amp;';
    else if (c === 0x3c) out += '&lt;';
    else if (c === 0x3e) out += '&gt;';
    else if (c === 0x22) out += '&quot;';
    else if (c === 0x27) out += '&#39;';
    else out += s[i];
  }
  return out;
}

export function htmlFromSegments(segments: Segment[]): string {
  let out = '';
  for (const { text, cls } of segments) {
    const escaped = escapeHtml(text);
    if (cls) out += `<span class="${cls}">${escaped}</span>`;
    else out += escaped;
  }
  return out;
}
