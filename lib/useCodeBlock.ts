'use client';
import { RefObject, useEffect, useMemo, useRef } from 'react';
import { computeLineStarts, visibleOffsetWindow } from './lineIndex';
import { buildTextNodeIndex, makeRange, TextNodeIndex } from './domIndex';
import { setBlockActiveRanges, clearBlock, isSupported } from './highlightManager';
import type { CompactRange } from './highlight';

interface ObserverCallbacks {
  onEnter: () => void;
  onLeave: () => void;
}

let sharedObserver: IntersectionObserver | null = null;
const observerCallbacks = new WeakMap<Element, ObserverCallbacks>();

function getSharedObserver(): IntersectionObserver {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const cbs = observerCallbacks.get(entry.target);
        if (!cbs) continue;
        if (entry.isIntersecting) cbs.onEnter();
        else cbs.onLeave();
      }
    },
    { rootMargin: '200px 0px' },
  );
  return sharedObserver;
}

function observeBlock(
  el: Element,
  onEnter: () => void,
  onLeave: () => void,
): () => void {
  const io = getSharedObserver();
  observerCallbacks.set(el, { onEnter, onLeave });
  io.observe(el);
  return () => {
    io.unobserve(el);
    observerCallbacks.delete(el);
  };
}

function firstPairIdxGte(entry: CompactRange, windowStart: number): number {
  const pairs = (entry.length - 1) >> 1;
  let lo = 0;
  let hi = pairs;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if ((entry[1 + mid * 2] as number) < windowStart) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function buildPerClassRanges(
  nodeIndex: TextNodeIndex,
  ranges: CompactRange[],
  windowStart: number,
  windowEnd: number,
): Map<string, Range[]> {
  const perClass = new Map<string, Range[]>();
  if (!nodeIndex.total) return perClass;

  for (const entry of ranges) {
    const token = entry[0] as string;
    const classes = token.split(/\s+/).filter(Boolean);
    if (!classes.length) continue;

    const startIdx = firstPairIdxGte(entry, windowStart);
    const pairs = (entry.length - 1) >> 1;

    for (let p = startIdx; p < pairs; p++) {
      const s = entry[1 + p * 2] as number;
      if (s >= windowEnd) break;
      const len = entry[2 + p * 2] as number;
      const e = s + len;
      if (e <= windowStart) continue;

      const clampedStart = Math.max(s, windowStart);
      const clampedEnd = Math.min(e, windowEnd, nodeIndex.total);
      if (clampedEnd <= clampedStart) continue;

      const range = makeRange(nodeIndex, clampedStart, clampedEnd);
      if (!range) continue;

      for (const c of classes) {
        let arr = perClass.get(c);
        if (!arr) perClass.set(c, (arr = []));
        arr.push(range);
      }
    }
  }
  return perClass;
}

interface UseCodeBlockOptions {
  ranges: CompactRange[];
  code: string;
  buffer?: number;
}

interface BlockState {
  ranges: CompactRange[];
  lineStarts: number[];
  nodeIndex: TextNodeIndex | null;
}

let nextId = 0;

export function useCodeBlock(
  codeRef: RefObject<HTMLElement | null>,
  { ranges, code, buffer = 30 }: UseCodeBlockOptions,
): void {
  const blockIdRef = useRef<number | null>(null);
  if (blockIdRef.current == null) blockIdRef.current = ++nextId;

  const lineStarts = useMemo(() => computeLineStarts(code), [code]);

  const stateRef = useRef<BlockState>({ ranges, lineStarts, nodeIndex: null });
  stateRef.current.ranges = ranges;
  stateRef.current.lineStarts = lineStarts;

  useEffect(() => {
    if (!isSupported()) return;
    const el = codeRef.current;
    if (!el) return;

    const blockId = blockIdRef.current!;
    stateRef.current.nodeIndex = buildTextNodeIndex(el);

    let visible = false;
    let rafPending = false;

    const apply = () => {
      rafPending = false;
      if (!visible) return;
      const { lineStarts: ls, ranges: rs, nodeIndex } = stateRef.current;
      if (!nodeIndex) return;
      const [ws, we] = visibleOffsetWindow(el, ls, buffer);
      if (we <= ws) {
        clearBlock(blockId);
        return;
      }
      const perClass = buildPerClassRanges(nodeIndex, rs, ws, we);
      setBlockActiveRanges(blockId, perClass);
    };
    const schedule = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(apply);
    };

    const onEnter = () => {
      visible = true;
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      schedule();
    };
    const onLeave = () => {
      visible = false;
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      clearBlock(blockId);
    };

    const unobserve = observeBlock(el, onEnter, onLeave);
    return () => {
      unobserve();
      onLeave();
    };
  }, [codeRef, buffer]);

  useEffect(() => {
    if (!isSupported()) return;
    const el = codeRef.current;
    if (!el) return;
    stateRef.current.nodeIndex = buildTextNodeIndex(el);
    const blockId = blockIdRef.current!;
    const { lineStarts: ls, ranges: rs, nodeIndex } = stateRef.current;
    if (!nodeIndex) return;
    const [ws, we] = visibleOffsetWindow(el, ls, buffer);
    if (we <= ws) return;
    const perClass = buildPerClassRanges(nodeIndex, rs, ws, we);
    setBlockActiveRanges(blockId, perClass);
  }, [codeRef, ranges, lineStarts, buffer]);
}
