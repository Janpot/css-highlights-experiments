export interface TextNodeIndex {
  nodes: Text[];
  starts: number[];
  total: number;
}

export function buildTextNodeIndex(codeEl: HTMLElement): TextNodeIndex {
  const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  const starts: number[] = [];
  let offset = 0;
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    nodes.push(n);
    starts.push(offset);
    offset += n.nodeValue?.length ?? 0;
  }
  return { nodes, starts, total: offset };
}

function upperBound(arr: number[], target: number): number {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function makeRange(
  index: TextNodeIndex,
  from: number,
  to: number,
): Range | null {
  const r = document.createRange();
  const i = Math.max(0, upperBound(index.starts, from) - 1);
  const j = Math.max(0, upperBound(index.starts, to - 1) - 1);
  const ni = index.nodes[i];
  const nj = index.nodes[j];
  if (!ni || !nj) return null;
  r.setStart(ni, Math.min(from - index.starts[i], ni.nodeValue?.length ?? 0));
  r.setEnd(nj, Math.min(to - index.starts[j], nj.nodeValue?.length ?? 0));
  return r;
}
