import { highlightTree, classHighlighter } from '@lezer/highlight';
import { TreeFragment } from '@lezer/common';

export function rangesFromTree(tree, highlighter = classHighlighter) {
  const buckets = new Map();
  highlightTree(tree, highlighter, (from, to, classes) => {
    let arr = buckets.get(classes);
    if (!arr) buckets.set(classes, (arr = []));
    arr.push(from, to - from);
  });
  return Array.from(buckets, ([token, offsets]) => [token, ...offsets]);
}

export function computeHighlights(parser, code, highlighter) {
  return rangesFromTree(parser.parse(code), highlighter);
}

export function parseIncremental(parser, code, prevFragments = []) {
  const tree = parser.parse(code, prevFragments);
  return { tree, fragments: TreeFragment.addTree(tree) };
}

export function applyEdit(prev, nextCode) {
  const changes = diffChange(prev.code, nextCode);
  const fragments = TreeFragment.applyChanges(prev.fragments, changes);
  return { code: nextCode, fragments };
}

function diffChange(a, b) {
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
