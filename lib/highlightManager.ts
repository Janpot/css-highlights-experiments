const supported =
  typeof CSS !== 'undefined' &&
  'highlights' in CSS &&
  typeof window !== 'undefined' &&
  typeof (window as unknown as { Highlight?: unknown }).Highlight !==
    'undefined';

const highlights = new Map<string, Highlight>();
const blockRanges = new Map<number, Map<string, Set<Range>>>();

const SPECIFIC = new Set(['lzh-fn', 'lzh-def', 'lzh-std', 'lzh-cls', 'lzh-type']);

function ensure(cls: string): Highlight {
  let h = highlights.get(cls);
  if (!h) {
    h = new Highlight();
    if (SPECIFIC.has(cls)) h.priority = 1;
    highlights.set(cls, h);
    CSS.highlights.set(cls, h);
  }
  return h;
}

export function setBlockActiveRanges(
  blockId: number,
  perClass: Map<string, Range[]>,
): void {
  if (!supported) return;
  clearBlock(blockId);
  const store = new Map<string, Set<Range>>();
  for (const [cls, rs] of perClass) {
    const h = ensure(cls);
    const set = new Set(rs);
    for (const r of set) h.add(r);
    store.set(cls, set);
  }
  blockRanges.set(blockId, store);
}

export function clearBlock(blockId: number): void {
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

export function isSupported(): boolean {
  return supported;
}
