'use client';
import { RefObject, useEffect } from 'react';
import { buildTextNodeIndex, makeRange } from './domIndex';
import {
  setBlockActiveRanges,
  clearBlock,
  isSupported,
} from './highlightManager';
import type { CompactRange } from './highlight';

let nextId = 0;

interface Options {
  code: string;
  ranges: CompactRange[];
}

export function useCodeBlock(
  codeRef: RefObject<HTMLElement | null>,
  { ranges }: Options,
): void {
  useEffect(() => {
    if (!isSupported()) return;
    const el = codeRef.current;
    if (!el) return;

    const blockId = ++nextId;
    const nodeIndex = buildTextNodeIndex(el);
    const perClass = new Map<string, Range[]>();

    for (const entry of ranges) {
      const token = entry[0] as string;
      const classes = token.split(/\s+/).filter(Boolean);
      if (!classes.length) continue;
      const pairs = (entry.length - 1) >> 1;
      for (let p = 0; p < pairs; p++) {
        const s = entry[1 + p * 2] as number;
        const len = entry[2 + p * 2] as number;
        const r = makeRange(nodeIndex, s, s + len);
        if (!r) continue;
        for (const c of classes) {
          let arr = perClass.get(c);
          if (!arr) perClass.set(c, (arr = []));
          arr.push(r);
        }
      }
    }
    setBlockActiveRanges(blockId, perClass);

    return () => clearBlock(blockId);
  }, [codeRef, ranges]);
}
