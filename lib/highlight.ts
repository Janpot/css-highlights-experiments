import { highlightTree, classHighlighter, Highlighter } from '@lezer/highlight';
import { Parser, Tree, TreeFragment, ChangedRange } from '@lezer/common';

export type CompactRange = [string, ...number[]];

export function rangesFromTree(
  tree: Tree,
  highlighter: Highlighter = classHighlighter,
): CompactRange[] {
  const buckets = new Map<string, number[]>();
  highlightTree(tree, highlighter, (from, to, classes) => {
    let arr = buckets.get(classes);
    if (!arr) buckets.set(classes, (arr = []));
    arr.push(from, to - from);
  });
  return Array.from(buckets, ([token, offsets]) => [token, ...offsets]);
}

export function computeHighlights(
  parser: Parser,
  code: string,
  highlighter?: Highlighter,
): CompactRange[] {
  return rangesFromTree(parser.parse(code), highlighter);
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
