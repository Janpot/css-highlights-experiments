const supported =
  typeof CSS !== 'undefined' &&
  'highlights' in CSS &&
  typeof window !== 'undefined' &&
  typeof window.Highlight !== 'undefined';

const highlights = new Map();
const blockRanges = new Map();

function ensure(cls) {
  let h = highlights.get(cls);
  if (!h) {
    h = new window.Highlight();
    highlights.set(cls, h);
    CSS.highlights.set(cls, h);
  }
  return h;
}

export function setBlockActiveRanges(blockId, perClass) {
  if (!supported) return;
  clearBlock(blockId);
  const store = new Map();
  for (const [cls, rs] of perClass) {
    const h = ensure(cls);
    const set = new Set(rs);
    for (const r of set) h.add(r);
    store.set(cls, set);
  }
  blockRanges.set(blockId, store);
}

export function clearBlock(blockId) {
  if (!supported) return;
  const prev = blockRanges.get(blockId);
  if (!prev) return;
  for (const [cls, rs] of prev) {
    const h = highlights.get(cls);
    if (!h) continue;
    for (const r of rs) h.delete(r);
  }
  blockRanges.delete(blockId);
}

export function isSupported() {
  return supported;
}
