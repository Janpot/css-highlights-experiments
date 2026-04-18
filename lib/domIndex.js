export function buildTextNodeIndex(codeEl) {
  const walker = document.createTreeWalker(codeEl, NodeFilter.SHOW_TEXT);
  const nodes = [];
  const starts = [];
  let offset = 0;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    nodes.push(n);
    starts.push(offset);
    offset += n.nodeValue.length;
  }
  return { nodes, starts, total: offset };
}

function upperBound(arr, target) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function makeRange(index, from, to) {
  const r = document.createRange();
  const i = Math.max(0, upperBound(index.starts, from) - 1);
  const j = Math.max(0, upperBound(index.starts, to - 1) - 1);
  const ni = index.nodes[i];
  const nj = index.nodes[j];
  if (!ni || !nj) return null;
  r.setStart(ni, Math.min(from - index.starts[i], ni.nodeValue.length));
  r.setEnd(nj, Math.min(to - index.starts[j], nj.nodeValue.length));
  return r;
}
