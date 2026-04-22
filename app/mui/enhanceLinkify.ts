import type { SourceEnhancer } from '@mui/internal-docs-infra/CodeHighlighter/types';

const URL_RE = /https?:\/\/[^\s'"<>()]+/g;
const TRAILING_PUNCT = /[.,;:!?)\]}]+$/;

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function makeAnchor(url: string): HastNode {
  return {
    type: 'element',
    tagName: 'a',
    properties: { href: url, target: '_blank', rel: 'noreferrer' },
    children: [{ type: 'text', value: url }],
  };
}

function splitText(value: string): HastNode[] | null {
  const out: HastNode[] = [];
  let last = 0;
  let found = false;
  URL_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_RE.exec(value))) {
    found = true;
    const start = m.index;
    let url = m[0];
    const trailing = TRAILING_PUNCT.exec(url);
    if (trailing) url = url.slice(0, -trailing[0].length);
    const end = start + url.length;
    if (start > last) out.push({ type: 'text', value: value.slice(last, start) });
    out.push(makeAnchor(url));
    last = end;
    URL_RE.lastIndex = end;
  }
  if (!found) return null;
  if (last < value.length) out.push({ type: 'text', value: value.slice(last) });
  return out;
}

function walk(children: HastNode[]): HastNode[] {
  const result: HastNode[] = [];
  for (const child of children) {
    if (child.type === 'text' && typeof child.value === 'string') {
      const split = splitText(child.value);
      result.push(...(split ?? [child]));
    } else if (child.type === 'element' && child.tagName !== 'a' && child.children) {
      result.push({ ...child, children: walk(child.children) });
    } else {
      result.push(child);
    }
  }
  return result;
}

export const enhanceLinkify: SourceEnhancer = (root) => {
  return { ...root, children: walk((root.children ?? []) as HastNode[]) } as typeof root;
};
