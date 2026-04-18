import { highlightTree, tagHighlighter, tags as t, Highlighter } from '@lezer/highlight';
import { Parser, Tree, TreeFragment, ChangedRange } from '@lezer/common';

export type CompactRange = [string, ...number[]];

export const defaultHighlighter: Highlighter = tagHighlighter([
  {
    tag: [
      t.keyword,
      t.controlKeyword,
      t.operatorKeyword,
      t.definitionKeyword,
      t.modifier,
      t.self,
    ],
    class: 'lzh-kw',
  },
  { tag: [t.string, t.special(t.string)], class: 'lzh-str' },
  { tag: t.regexp, class: 'lzh-re' },
  { tag: t.escape, class: 'lzh-esc' },
  { tag: [t.number, t.integer, t.float], class: 'lzh-num' },
  { tag: t.bool, class: 'lzh-bool' },
  { tag: t.null, class: 'lzh-nul' },
  { tag: [t.lineComment, t.blockComment, t.docComment, t.comment], class: 'lzh-cmt' },
  { tag: t.variableName, class: 'lzh-var' },
  { tag: t.propertyName, class: 'lzh-prop' },
  { tag: t.className, class: 'lzh-cls' },
  { tag: t.typeName, class: 'lzh-type' },
  { tag: t.operator, class: 'lzh-op' },
  { tag: [t.punctuation, t.paren, t.brace, t.bracket, t.separator], class: 'lzh-punct' },
  { tag: t.meta, class: 'lzh-meta' },
]);

export function rangesFromTree(
  tree: Tree,
  highlighter: Highlighter = defaultHighlighter,
): CompactRange[] {
  const buckets = new Map<string, number[]>();
  highlightTree(tree, highlighter, (from, to, classes) => {
    let arr = buckets.get(classes);
    if (!arr) buckets.set(classes, (arr = []));
    arr.push(from, to - from);
  });
  return Array.from(buckets, ([token, offsets]) => [token, ...offsets]);
}

export function computeHighlights(parser: Parser, code: string): CompactRange[] {
  return rangesFromTree(parser.parse(code));
}

export interface ParseState {
  code: string;
  fragments: readonly TreeFragment[];
}

export function parseIncremental(
  parser: Parser,
  code: string,
  prevFragments: readonly TreeFragment[] = [],
): { tree: Tree; fragments: readonly TreeFragment[] } {
  const tree = parser.parse(code, prevFragments);
  return { tree, fragments: TreeFragment.addTree(tree) };
}

export function applyEdit(prev: ParseState, nextCode: string): ParseState {
  const changes = diffChange(prev.code, nextCode);
  const fragments = TreeFragment.applyChanges(prev.fragments, changes);
  return { code: nextCode, fragments };
}

function diffChange(a: string, b: string): ChangedRange[] {
  if (a === b) return [];
  let p = 0;
  const max = Math.min(a.length, b.length);
  while (p < max && a.charCodeAt(p) === b.charCodeAt(p)) p++;
  let sa = a.length;
  let sb = b.length;
  while (sa > p && sb > p && a.charCodeAt(sa - 1) === b.charCodeAt(sb - 1)) {
    sa--;
    sb--;
  }
  return [{ fromA: p, toA: sa, fromB: p, toB: sb }];
}
